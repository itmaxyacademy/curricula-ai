import asyncio
import json
import re
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Session as DbSession, Course, Lesson, Section, Pptx, History
import schemas
import pipeline
from services.progress_service import progress_publisher
from services.generator_service import (
    generate_course_content_task_async,
    generate_course_content_task,
    cancel_session,
    uncancel_session,
    ACTIVE_TASKS
)


def parse_duration_to_minutes(duration_str, lesson_count: int = None) -> int:
    """Parse duration string from AI to a sensible per-lesson minutes integer (5 - 180 min).
    Supports:
    - "30 minutes" -> 30
    - "1 hour" -> 60
    - "2 lesson = 60 menit" -> 30 min/lesson
    - "60 menit total untuk 2 lesson" -> 30 min/lesson
    - "3 weeks" -> 60 min/lesson
    """
    if not duration_str:
        return 60
    duration_lower = str(duration_str).lower()

    if any(unit in duration_lower for unit in ['week', 'month', 'semester', 'year', 'day']):
        return 60

    # Pattern: "2 lesson = 60 menit" / "2 modul = 1 jam"
    match_l_first = re.search(r'(\d+)\s*(?:lesson|pelajaran|modul|materi)[^\d]+?(\d+)\s*(?:menit|min|minutes?|jam|hours?|hrs?)', duration_lower)
    if match_l_first:
        l_count = int(match_l_first.group(1))
        dur_val = int(match_l_first.group(2))
        if any(h in duration_lower for h in ['jam', 'hour', 'hr']):
            dur_val *= 60
        if l_count > 0:
            return max(5, min(180, round(dur_val / l_count)))

    # Pattern: "60 menit total untuk 2 lesson"
    match_t_first = re.search(r'(\d+)\s*(?:menit|min|minutes?|jam|hours?|hrs?)[^\d]+?(\d+)\s*(?:lesson|pelajaran|modul|materi)', duration_lower)
    if match_t_first:
        dur_val = int(match_t_first.group(1))
        l_count = int(match_t_first.group(2))
        if any(h in duration_lower for h in ['jam', 'hour', 'hr']):
            dur_val *= 60
        if l_count > 0:
            return max(5, min(180, round(dur_val / l_count)))

    match = re.search(r'(\d+)', duration_lower)
    if not match:
        return 60
    number = int(match.group(1))

    if 'hour' in duration_lower or 'hr' in duration_lower or 'jam' in duration_lower:
        minutes = number * 60
    else:
        minutes = number

    if ('total' in duration_lower or 'overall' in duration_lower) and lesson_count and lesson_count > 1:
        minutes = round(minutes / lesson_count)

    return max(5, min(180, minutes))

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


@router.get("/sessions/{session_id}/stream-progress")
async def stream_progress(session_id: str, background_tasks: BackgroundTasks):
    # Auto-resume background generation if server was restarted and session is in generating state
    if session_id not in ACTIVE_TASKS:
        db = SessionLocal()
        try:
            db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
            if db_session and db_session.status in ["generating", "queued"]:
                uncancel_session(session_id)
                background_tasks.add_task(generate_course_content_task_async, session_id)
        finally:
            db.close()

    async def event_generator():
        q = progress_publisher.subscribe(session_id)
        db = SessionLocal()
        try:
            db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
            if db_session:
                init_data = {
                    "progress": db_session.progress,
                    "status": db_session.status,
                    "status_text": db_session.status_text,
                    "step": db_session.step
                }
                yield f"data: {json.dumps(init_data)}\n\n"
        finally:
            db.close()

        try:
            while True:
                data = await q.get()
                yield f"data: {json.dumps(data)}\n\n"
                if data.get("status") in ["completed", "error", "canceled"]:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            progress_publisher.unsubscribe(session_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions/{session_id}/progress")
def get_session_progress(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Auto-resume if in generating state but not active
    if db_session.status in ["generating", "queued"] and session_id not in ACTIVE_TASKS:
        uncancel_session(session_id)
        background_tasks.add_task(generate_course_content_task_async, session_id)

    return {
        "session_id": db_session.id,
        "progress": db_session.progress,
        "status": db_session.status,
        "status_text": db_session.status_text,
        "step": db_session.step
    }


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DbSession).all()
    # Sort with newest created course on top
    sessions.sort(key=lambda s: getattr(s, "created_at", None) or "", reverse=True)
    result = []
    for s in sessions:
        course = db.query(Course).filter(Course.id == s.id).first()
        title = course.title if course else s.prompt

        tags = []
        if s.tech_tags:
            try:
                tags = json.loads(s.tech_tags)
            except Exception:
                tags = []
        if not tags:
            tags = pipeline.get_default_candidate_tags(s.prompt or title or "AI Course", [])

        result.append({
            "session_id": s.id,
            "title": title or s.prompt or "Untitled Course",
            "prompt": s.prompt,
            "step": s.step,
            "status": s.status,
            "progress": s.progress,
            "difficulty": s.config_difficulty,
            "audience": s.config_audience,
            "tech_tags": tags,
            "created_at": getattr(s, "created_at", None)
        })
    return result


@router.post("/sessions")
def create_session(input_data: schemas.KeywordInput, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())

    ai_result = pipeline.generate_concept_and_grounding(input_data.keyword)
    grounding = ai_result.get("grounding", {})
    tech_tags = grounding.get("tech_tags", [])
    all_suggested_tags = grounding.get("all_suggested_tags", pipeline.get_default_candidate_tags(input_data.keyword, tech_tags))

    display_title = ai_result.get("display_title", input_data.keyword)
    explicit_params = ai_result.get("explicit_parameters", {})
    lesson_count_override = explicit_params.get("lesson_count")
    duration_override = explicit_params.get("duration")

    db_session = DbSession(
        id=session_id,
        created_at=datetime.utcnow().isoformat(),
        step="context",
        prompt=input_data.keyword,
        tech_tags=json.dumps(tech_tags),
        prerequisites=json.dumps(grounding.get("prerequisites", [])),
        boundaries=json.dumps(grounding.get("out_of_scope", [])),
        learning_outcomes=json.dumps(grounding.get("learning_outcomes", [])),
        config_audience=grounding.get("target_audience", "Student"),
        subject_context=ai_result.get("subject_context", ""),
        all_suggested_tags=json.dumps(all_suggested_tags),
        status="idle",
        progress=0
    )

    if lesson_count_override and isinstance(lesson_count_override, int):
        db_session.config_lessons = lesson_count_override
    db_session.config_duration = parse_duration_to_minutes(duration_override) if duration_override else 60

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return {
        "session_id": session_id,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": json.loads(db_session.tech_tags),
        "all_suggested_tags": all_suggested_tags,
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "subject_context": db_session.subject_context
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    lessons_data = []
    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        for lesson in sorted(course.lessons, key=lambda l: l.position):
            sections_data = {}
            for sec in lesson.sections:
                if sec.role not in sections_data:
                    sections_data[sec.role] = {}
                try:
                    sections_data[sec.role][sec.section_type] = json.loads(sec.content_text)
                except Exception:
                    sections_data[sec.role][sec.section_type] = sec.content_text
            lessons_data.append({
                "id": lesson.id,
                "title": lesson.title,
                "order": lesson.position,
                "sections": sections_data
            })

    # Auto-complete or auto-resume if session is in 'generating' status without active background task
    if db_session.status == "generating" and session_id not in ACTIVE_TASKS:
        expected_count = len(json.loads(db_session.structure)) if db_session.structure else 1
        if len(lessons_data) >= expected_count and all(len(l.get("sections", {})) >= 3 for l in lessons_data):
            db_session.status = "completed"
            db_session.progress = 100
            db_session.status_text = "Course Generation Completed!"
            db_session.step = "generated"
            db.commit()
        else:
            # Automatically resume background generation task safely on main event loop
            uncancel_session(session_id)
            background_tasks.add_task(generate_course_content_task_async, session_id)

    pptx_by_lesson = {}
    if course:
        lesson_ids = [l.id for l in course.lessons]
        if lesson_ids:
            pptx_records = db.query(Pptx).filter(Pptx.lesson_id.in_(lesson_ids)).all()
            for pptx in pptx_records:
                try:
                    pptx_by_lesson[pptx.lesson_id] = {"layouts": json.loads(pptx.layouts_json)}
                except Exception:
                    pptx_by_lesson[pptx.lesson_id] = {}

    course_title = course.title if course else (db_session.prompt or "Untitled Course")
    loaded_tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    try:
        saved_suggested = json.loads(db_session.all_suggested_tags) if db_session.all_suggested_tags else []
    except Exception:
        saved_suggested = []
    all_suggested = saved_suggested if saved_suggested and len(saved_suggested) > 0 else pipeline.get_default_candidate_tags(db_session.prompt, loaded_tech_tags)

    return {
        "session_id": db_session.id,
        "title": course_title,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": loaded_tech_tags,
        "all_suggested_tags": all_suggested,
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
            "subject_context": db_session.subject_context
        },
        "subject_context": db_session.subject_context,
        "document_filename": db_session.document_filename,
        "proposals": json.loads(db_session.proposals) if db_session.proposals else [],
        "selected_proposal_id": db_session.selected_proposal_id,
        "structure": json.loads(db_session.structure) if db_session.structure else [],
        "status": db_session.status,
        "progress": db_session.progress,
        "status_text": db_session.status_text,
        "lessons": lessons_data,
        "pptx_by_lesson": pptx_by_lesson
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Explicitly clean up related history and course data
    db.query(History).filter(History.session_id == session_id).delete()
    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        db.delete(course)
    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted successfully"}


@router.patch("/sessions/{session_id}/status")
def update_session_status(session_id: str, payload: dict, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    new_status = payload.get("status")
    if new_status:
        db_session.status = new_status
        db.commit()
    return {"message": "Status updated successfully", "status": db_session.status}


@router.post("/sessions/{session_id}/grounding")
def save_grounding(session_id: str, grounding_data: schemas.GroundingInput, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    sanitized_prereqs = pipeline.translate_and_standardize_list(grounding_data.prerequisites, is_title=False)
    sanitized_boundaries = pipeline.translate_and_standardize_list(grounding_data.out_of_scope, is_title=False)
    sanitized_outcomes = pipeline.translate_and_standardize_list(grounding_data.learning_outcomes, is_title=False)

    db_session.tech_tags = json.dumps(grounding_data.tech_tags)
    db_session.prerequisites = json.dumps(sanitized_prereqs)
    db_session.boundaries = json.dumps(sanitized_boundaries)
    db_session.learning_outcomes = json.dumps(sanitized_outcomes)
    db_session.config_audience = grounding_data.target_audience
    
    # Strip any raw metadata headers (like [DOMAIN:...], [TOOLS REQUIRED:...]) from subject_context
    if db_session.subject_context:
        import re
        db_session.subject_context = re.sub(r'\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?', '', db_session.subject_context).strip()

    db_session.step = "proposal"
    db.commit()

    return {
        "message": "Grounding saved successfully",
        "step": db_session.step,
        "prerequisites": sanitized_prereqs,
        "out_of_scope": sanitized_boundaries,
        "learning_outcomes": sanitized_outcomes
    }


@router.post("/sections/ai-enhance")
def enhance_custom_section_api(payload: dict, db: Session = Depends(get_db)):
    raw_title = payload.get("title", "")
    raw_inst = payload.get("instruction", "")
    session_id = payload.get("session_id", "")

    ctx = ""
    if session_id:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if db_session:
            ctx = f"{db_session.prompt or ''} - {db_session.subject_context or ''}"

    enhanced = pipeline.enhance_and_translate_custom_section(raw_title, raw_inst, ctx)
    return enhanced


@router.post("/sessions/{session_id}/grounding/suggest")
async def suggest_grounding_item(session_id: str, req: schemas.GroundingSuggestRequest, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    suggestion = await pipeline.generate_single_grounding_item(
        keyword=db_session.prompt or "Software Development",
        field_type=req.field_type,
        existing_items=req.existing_items,
        difficulty=db_session.config_difficulty or "Beginner",
        audience=db_session.config_audience or "Student",
        tech_tags=tech_tags
    )
    return {"suggestion": suggestion}


@router.post("/sessions/{session_id}/config")
def update_config(session_id: str, config_data: schemas.CourseConfigUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.config_lessons = config_data.lessons_count
    db_session.config_duration = config_data.duration
    db_session.config_difficulty = config_data.difficulty
    db_session.config_audience = config_data.target_audience
    db_session.subject_context = config_data.subject_context
    if config_data.tech_tags is not None:
        sanitized_tags = [pipeline.to_title_case_en(str(t).strip()) for t in config_data.tech_tags if t and str(t).strip()]
        db_session.tech_tags = json.dumps(sanitized_tags)
    db.commit()

    return {"message": "Config updated successfully"}


@router.post("/sessions/{session_id}/grounding/refresh")
def refresh_grounding_endpoint(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    ai_result = pipeline.generate_concept_and_grounding(
        keyword=db_session.prompt or "Software Development",
        tags=tech_tags,
        difficulty=db_session.config_difficulty or "Beginner",
        audience=db_session.config_audience or "Student",
        document_context=db_session.document_context or ""
    )
    grounding = ai_result.get("grounding", {})
    prerequisites = grounding.get("prerequisites", [])
    out_of_scope = grounding.get("out_of_scope", [])
    learning_outcomes = grounding.get("learning_outcomes", [])

    db_session.prerequisites = json.dumps(prerequisites)
    db_session.boundaries = json.dumps(out_of_scope)
    db_session.learning_outcomes = json.dumps(learning_outcomes)
    db.commit()

    return {
        "prerequisites": prerequisites,
        "out_of_scope": out_of_scope,
        "learning_outcomes": learning_outcomes,
        "tech_tags": tech_tags,
        "subject_context": ai_result.get("subject_context", db_session.subject_context)
    }


@router.post("/sessions/{session_id}/proposals/generate")
def generate_proposals_api(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    grounding = {
        "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "target_audience": db_session.config_audience or "Student",
        "subject_context": db_session.subject_context or "",
        "document_context": db_session.document_context or ""
    }

    proposals = pipeline.generate_proposals(db_session.prompt, grounding)
    db_session.proposals = json.dumps(proposals)
    db_session.step = "proposal"
    db.commit()

    return {"proposals": proposals}


@router.post("/sessions/{session_id}/proposals/select")
def select_proposal(session_id: str, payload: schemas.ProposalSelect, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    proposals_list = json.loads(db_session.proposals) if db_session.proposals else []
    selected_proposal = next((p for p in proposals_list if p["id"] == payload.selected_proposal_id), None)
    if not selected_proposal:
        raise HTTPException(status_code=400, detail="Invalid proposal ID")

    db_session.selected_proposal_id = payload.selected_proposal_id

    grounding = {
        "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "target_audience": db_session.config_audience or "Student",
        "subject_context": db_session.subject_context or "",
        "document_context": db_session.document_context or ""
    }
    config = {
        "lessons_count": db_session.config_lessons,
        "difficulty": db_session.config_difficulty
    }

    structure = pipeline.generate_structure(selected_proposal["title"], config, grounding)
    db_session.structure = json.dumps(structure)
    db_session.step = "structure"
    db.commit()

    return {"message": "Proposal selected and structure generated", "structure": structure}


@router.post("/sessions/{session_id}/structure/save")
def save_structure(session_id: str, payload: schemas.StructureUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    structure_list = []
    for l in payload.lessons:
        lesson_dict = {"id": l.id, "title": l.title, "order": l.order}
        if l.sections is not None:
            lesson_dict["sections"] = l.sections
        structure_list.append(lesson_dict)

    sanitized_structure = pipeline.sanitize_custom_structure(structure_list)
    db_session.structure = json.dumps(sanitized_structure)
    db_session.step = "review"

    # If this course has already been generated at least once, keep the
    # already-created Lesson rows in sync with the (possibly reordered)
    # blueprint immediately — not just at the next full generation run.
    # Without this, reordering lessons after generation updates only the
    # blueprint JSON, while `Lesson.position`/`title` in the database stay
    # exactly as they were from the last generation, so exports (PDF, etc.)
    # keep showing the old order until the course is regenerated.
    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        current_keys = {str(item.get("id", i + 1)) for i, item in enumerate(sanitized_structure)}

        # Drop lessons that were removed from the structure entirely.
        stale_lessons = db.query(Lesson).filter(
            Lesson.course_id == session_id,
            Lesson.structure_key.isnot(None),
            ~Lesson.structure_key.in_(current_keys)
        ).all() if current_keys else []
        for stale in stale_lessons:
            db.delete(stale)

        for idx, item in enumerate(sanitized_structure):
            struct_key = str(item.get("id", idx + 1))
            lesson = db.query(Lesson).filter(
                Lesson.course_id == session_id,
                Lesson.structure_key == struct_key
            ).first()
            # Legacy fallback for rows created before structure_key existed.
            if not lesson:
                lesson = db.query(Lesson).filter(
                    Lesson.course_id == session_id,
                    Lesson.structure_key.is_(None),
                    Lesson.position == idx + 1
                ).first()
            if lesson:
                if lesson.position != idx + 1:
                    lesson.position = idx + 1
                if lesson.title != item["title"]:
                    lesson.title = item["title"]
                if lesson.structure_key != struct_key:
                    lesson.structure_key = struct_key
            # If no matching Lesson row exists yet, it simply hasn't been
            # generated yet — nothing to sync, the next generation run
            # will create it with the correct position/structure_key.

    db.commit()

    return {"message": "Structure saved successfully", "step": db_session.step, "structure": sanitized_structure}


@router.post("/sessions/{session_id}/content/generate")
async def trigger_generation(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Clear any previous cancellation state immediately
    uncancel_session(session_id)

    db_session.status = "generating"
    db_session.step = "generating"
    if not db_session.progress or db_session.progress < 10:
        db_session.progress = 10
    db_session.status_text = "Generation starting..."
    db.commit()

    await progress_publisher.publish(session_id, {
        "progress": db_session.progress,
        "status": "generating",
        "status_text": db_session.status_text,
        "step": "generating"
    })

    background_tasks.add_task(generate_course_content_task_async, session_id)
    return {"message": "Generation started", "status": "generating"}


@router.post("/sessions/{session_id}/pause")
async def pause_generation(session_id: str, db: Session = Depends(get_db)):
    # Immediately trigger in-memory pause flag
    cancel_session(session_id)
    
    try:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if db_session:
            db_session.status = "paused"
            db_session.step = "generating"
            db_session.status_text = "Generation paused by user."
            db.commit()
    except Exception as e:
        print(f"[Pause Warning] Database update deferred: {e}")
        try:
            db.rollback()
        except Exception:
            pass

    return {"status": "paused"}


@router.post("/sessions/{session_id}/cancel")
async def cancel_generation(session_id: str, db: Session = Depends(get_db)):
    # Immediately trigger in-memory cancellation flag
    cancel_session(session_id)
    
    # Broadcast to real-time subscribers immediately
    await progress_publisher.publish(session_id, {
        "progress": 0,
        "status": "canceled",
        "status_text": "Generation canceled by user.",
        "step": "review"
    })
    
    try:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if db_session:
            db_session.status = "canceled"
            db_session.step = "review"
            db_session.status_text = "Generation canceled by user."
            db.commit()
    except Exception as e:
        print(f"[Cancel Warning] Database update deferred: {e}")
        try:
            db.rollback()
        except Exception:
            pass

    return {"status": "canceled"}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # Delete related PPTX records if any
        course = db.query(Course).filter(Course.id == session_id).first()
        if course:
            lesson_ids = [l.id for l in course.lessons]
            if lesson_ids:
                db.query(Pptx).filter(Pptx.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
            db.delete(course)

        db.delete(db_session)
        db.commit()
        return {"message": "Course session deleted successfully", "session_id": session_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")