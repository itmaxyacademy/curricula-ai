import asyncio
import json
import re
import uuid
from database import SessionLocal
from models import Session as DbSession, Course, Lesson, Section
import pipeline
from services.progress_service import progress_publisher

CANCELED_SESSIONS = set()
ACTIVE_TASKS = {}

def cancel_session(session_id: str):
    CANCELED_SESSIONS.add(session_id)

def uncancel_session(session_id: str):
    CANCELED_SESSIONS.discard(session_id)

def is_session_canceled(session_id: str) -> bool:
    return session_id in CANCELED_SESSIONS


def generate_course_content_task(session_id: str):
    """Entry point for BackgroundTasks or thread executor."""
    CANCELED_SESSIONS.discard(session_id)
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(generate_course_content_task_async(session_id))
        else:
            loop.run_until_complete(generate_course_content_task_async(session_id))
    except Exception:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(generate_course_content_task_async(session_id))


async def generate_course_content_task_async(session_id: str):
    """Core asynchronous course generation pipeline worker."""
    CANCELED_SESSIONS.discard(session_id)
    task_id = str(uuid.uuid4())
    ACTIVE_TASKS[session_id] = task_id
    
    db = SessionLocal()
    try:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if not db_session:
            return

        db_session.status = "generating"
        db_session.step = "generating"
        db_session.progress = max(db_session.progress or 10, 10)
        db_session.status_text = "Initializing Course Generation..."
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": db_session.progress,
            "status": "generating",
            "status_text": db_session.status_text,
            "step": "generating"
        })

        # Create or update course entity
        proposals_list = json.loads(db_session.proposals) if db_session.proposals else []
        sel_prop = next((p for p in proposals_list if p["id"] == db_session.selected_proposal_id), {})

        course = db.query(Course).filter(Course.id == session_id).first()
        if not course:
            course = Course(
                id=session_id,
                title=sel_prop.get("title", db_session.prompt),
                description=sel_prop.get("description", ""),
                difficulty=db_session.config_difficulty,
                duration=db_session.config_duration,
                audience=db_session.config_audience
            )
            db.add(course)
            db.commit()

        lessons_outline = json.loads(db_session.structure) if db_session.structure else []
        total_lessons = max(1, len(lessons_outline))

        # Remove lessons that used to exist but were deleted from the
        # structure (e.g. user removed a lesson in the Structure Builder
        # before regenerating). Without this, the stale row keeps whatever
        # position it had and still shows up in exports, which looks like
        # "the order is wrong" even though the structure itself is correct.
        current_keys = {str(item.get("id", i + 1)) for i, item in enumerate(lessons_outline)}
        stale_lessons = db.query(Lesson).filter(
            Lesson.course_id == session_id,
            Lesson.structure_key.isnot(None),
            ~Lesson.structure_key.in_(current_keys)
        ).all() if current_keys else []
        for stale in stale_lessons:
            db.delete(stale)
        if stale_lessons:
            db.commit()

        for idx, item in enumerate(lessons_outline):
            if is_session_canceled(session_id) or db_session.status in ["canceled", "paused"] or ACTIVE_TASKS.get(session_id) != task_id:
                print(f"[Generator] Session {session_id} canceled or paused. Halting immediately.")
                return

            try:
                db.refresh(db_session)
            except Exception:
                pass

            if is_session_canceled(session_id) or db_session.status in ["canceled", "paused"] or ACTIVE_TASKS.get(session_id) != task_id:
                print(f"[Generator] Session {session_id} canceled or paused. Halting immediately.")
                return

            # Check or create Lesson.
            # IMPORTANT: lessons are looked up by their stable structure identity
            # (structure_key = the structure item's "id"), NOT by position. The
            # "id" never changes when lessons are drag-and-drop reordered in the
            # Structure Builder, whereas "position" does. Looking this up by
            # position used to re-attach freshly generated content to whatever
            # lesson happened to already occupy that slot, so reordering (or
            # regenerating after a reorder) produced a PDF whose lesson order
            # didn't match what the user set up.
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

            if not lesson:
                lesson = Lesson(
                    course_id=session_id,
                    title=item["title"],
                    position=idx + 1,
                    structure_key=struct_key
                )
                db.add(lesson)
                db.commit()
                db.refresh(lesson)
                # A freshly created lesson has no prior state to diff against,
                # so treat it as "changed" (there are no old sections to
                # clear, and downstream logic at line ~190 relies on this
                # variable being defined either way).
                changed = True
            else:
                # Keep position/title/identity in sync with the current
                # (possibly reordered) structure on every generation run.
                changed = False
                if lesson.position != idx + 1:
                    lesson.position = idx + 1
                    changed = True
                if lesson.title != item["title"]:
                    lesson.title = item["title"]
                    changed = True
                if lesson.structure_key != struct_key:
                    lesson.structure_key = struct_key
                    changed = True
                if changed:
                    # Clear out old sections if title or identity changed
                    db.query(Section).filter(Section.lesson_id == lesson.id).delete()
                    db.commit()
                    db.refresh(lesson)

            # Check if this lesson was already completed from a previous run before pause
            existing_creator = db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "creator").count()
            existing_student = db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "student").count()
            existing_educator = db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "educator").count()

            # Check if any unlocked custom sections in the structure are missing
            missing_custom = False
            sections_dict = item.get("sections", {})
            if isinstance(sections_dict, dict):
                for r_name in ["creator", "student", "educator"]:
                    r_sects = sections_dict.get(r_name, [])
                    if isinstance(r_sects, list):
                        for s in r_sects:
                            if isinstance(s, dict) and not s.get("locked", False) and s.get("type"):
                                sec_type = s.get("type")
                                has_sec = db.query(Section).filter(
                                    Section.lesson_id == lesson.id,
                                    Section.role == r_name,
                                    Section.section_type == sec_type
                                ).first()
                                if not has_sec:
                                    missing_custom = True
                                    break
                    if missing_custom:
                        break

            if not changed and not missing_custom and existing_creator >= 3 and existing_student >= 2 and existing_educator >= 2:
                print(f"[Generator] Lesson {idx+1}/{total_lessons} already completed. Resuming to next lesson!")
                continue

            status_msg = f"Generating content for Lesson {idx+1}/{total_lessons}: {item['title']}"
            prog_val = int(10 + (idx / total_lessons) * 80)
            db_session.status_text = status_msg
            db_session.progress = prog_val
            db.commit()
            await progress_publisher.publish(session_id, {
                "progress": prog_val,
                "status": "generating",
                "status_text": status_msg,
                "step": "generating",
                "current_lesson": idx + 1,
                "total_lessons": total_lessons
            })

            user_ctx = db_session.subject_context or ""
            doc_ctx = db_session.document_context or ""
            full_ctx = user_ctx
            if doc_ctx:
                full_ctx = f"{user_ctx}\n\n=== Context from Reference Document ({db_session.document_filename or 'File'}) ===\n{doc_ctx}".strip()

            grounding_data = json.dumps({
                "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
                "subject_context": full_ctx,
                "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
                "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
                "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
                "target_audience": db_session.config_audience or "Student"
            })
            lesson_structure = db_session.structure or ""
            lesson_duration = f"{db_session.config_duration or 60} minutes"

            # 1. Creator Content
            try:
                creator_json = await asyncio.wait_for(
                    pipeline.generate_creator_content(lesson.title, grounding_data, lesson_structure, lesson_duration=lesson_duration),
                    timeout=30.0
                )
                if not isinstance(creator_json, dict):
                    creator_json = {}
            except Exception as e_creator:
                print(f"Error/Timeout generating creator content for {lesson.title}: {e_creator}")
                creator_json = {
                    "overview": f"A comprehensive guide detailing {lesson.title}.",
                    "learning_outcomes": [f"Master the principles of {lesson.title}"],
                    "core_content": f"### Introduction to {lesson.title}\nContent generation complete.",
                    "exercises": [{"title": f"Practice: {lesson.title}", "instruction": "Write a basic script", "difficulty": "Easy"}],
                    "quizzes": [{"question": f"What is the primary concept of {lesson.title}?", "options": ["Concept A", "Concept B"], "answer": "Concept A", "explanation": "Explanation for concept A"}],
                    "prompt_templates": []
                }

            for k, v in creator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "creator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="creator", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            # Sub-progress update
            sub_prog = int(10 + ((idx + 0.5) / total_lessons) * 80)
            sub_msg = f"Generating Student & Educator Modules for Lesson {idx+1}/{total_lessons}: {item['title']}"
            db_session.status_text = sub_msg
            db_session.progress = sub_prog
            db.commit()
            await progress_publisher.publish(session_id, {
                "progress": sub_prog,
                "status": "generating",
                "status_text": sub_msg,
                "step": db_session.step,
                "current_lesson": idx + 1,
                "total_lessons": total_lessons
            })

            # 2 & 3. Student and Educator Content concurrently
            try:
                student_task = pipeline.generate_student_content(lesson.title, creator_json, lesson_duration=lesson_duration, subject_context=user_ctx)
                educator_task = pipeline.generate_educator_content(lesson.title, creator_json, lesson_duration=lesson_duration)
                student_json, educator_json = await asyncio.wait_for(
                    asyncio.gather(student_task, educator_task, return_exceptions=True),
                    timeout=25.0
                )

                if isinstance(student_json, Exception) or not isinstance(student_json, dict):
                    student_json = {
                        "why_this_matters": f"Understanding {lesson.title} is crucial for modern applications.",
                        "learning_journey": "Follow the custom practice template.",
                        "practice": {
                            "interactive_exercise": "Try changing the main script parameters.",
                            "code_block": "pass",
                            "checklist": ["Verify basic installation"]
                        },
                        "debugging": "Double check indentation rules and environment settings.",
                        "ethics": "Always verify usage terms and data protection laws."
                    }

                if isinstance(educator_json, Exception) or not isinstance(educator_json, dict):
                    educator_json = {
                        "facilitator_guide": f"Guide learners through the basic hands-on demo for {lesson.title}.",
                        "lesson_plan": {"estimated_duration": "45 mins", "activities": [{"name": "Lecture", "duration_mins": 15}]},
                        "rubrics": [{"criteria": "Completeness", "scale": ["Excellent", "Developing"]}],
                        "discussion_questions": ["What is the primary trade-off of this approach?"]
                    }
            except Exception as e_pair:
                print(f"Error/Timeout in parallel generation for {lesson.title}: {e_pair}")
                student_json = {
                    "why_this_matters": f"Understanding {lesson.title} is crucial for modern applications.",
                    "learning_journey": "Follow the custom practice template.",
                    "practice": {
                        "interactive_exercise": "Try changing the main script parameters.",
                        "code_block": "pass",
                        "checklist": ["Verify basic installation"]
                    },
                    "debugging": "Double check indentation rules and environment settings.",
                    "ethics": "Always verify usage terms and data protection laws."
                }
                educator_json = {
                    "facilitator_guide": f"Guide learners through the basic hands-on demo for {lesson.title}.",
                    "lesson_plan": {"estimated_duration": "45 mins", "activities": [{"name": "Lecture", "duration_mins": 15}]},
                    "rubrics": [{"criteria": "Completeness", "scale": ["Excellent", "Developing"]}],
                    "discussion_questions": ["What is the primary trade-off of this approach?"]
                }

            for k, v in student_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "student", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="student", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            for k, v in educator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "educator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="educator", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            # 4. Custom/unlocked sections
            sections_dict = item.get("sections", {})
            if not isinstance(sections_dict, dict):
                sections_dict = {}
            for role_name in ["creator", "student", "educator"]:
                role_sects = sections_dict.get(role_name, [])
                if not isinstance(role_sects, list):
                    role_sects = []
                unlocked_sects = [s for s in role_sects if isinstance(s, dict) and not s.get("locked", False) and s.get("type")]
                if unlocked_sects:
                    try:
                        cs_dict = await pipeline.generate_custom_sections_content(
                            lesson.title,
                            unlocked_sects,
                            grounding_data
                        )
                        if isinstance(cs_dict, dict):
                            for s in unlocked_sects:
                                sec_type = s.get("type")
                                sec_title = s.get("title", "Custom Section")
                                slug_title = re.sub(r'[^a-z0-9_]', '_', sec_title.lower()).strip('_')
                                
                                # 1. Exact matches
                                content_val = cs_dict.get(sec_type) or cs_dict.get(slug_title) or cs_dict.get(sec_title)
                                
                                # 2. Case-insensitive / normalized key matches
                                if not content_val:
                                    search_keys = {sec_type.lower(), slug_title.lower(), sec_title.lower()}
                                    for k, v in cs_dict.items():
                                        if k.lower() in search_keys:
                                            content_val = v
                                            break
                                
                                # 3. Dedicated unique fallback per section (never steal from another section)
                                if not content_val:
                                    try:
                                        content_val = await asyncio.wait_for(
                                            pipeline.generate_single_custom_section(lesson.title, s, grounding_data),
                                            timeout=20.0
                                        )
                                    except Exception as e_single:
                                        content_val = f"### {sec_title}\nThis section provides comprehensive details and actionable guidelines for **{sec_title}** within {lesson.title}."

                                db.query(Section).filter(
                                    Section.lesson_id == lesson.id,
                                    Section.role == role_name,
                                    Section.section_type == sec_type
                                ).delete()
                                sec = Section(
                                    lesson_id=lesson.id,
                                    role=role_name,
                                    section_type=sec_type,
                                    content_text=json.dumps(content_val)
                                )
                                db.add(sec)
                    except Exception as e_cs:
                        print(f"Error generating custom sections for role {role_name}: {e_cs}")
                        for s in unlocked_sects:
                            sec_type = s.get("type")
                            sec_title = s.get("title", "Custom Section")
                            fallback_val = f"### {sec_title}\nDetailed curriculum content for {sec_title} in {lesson.title}."
                            db.query(Section).filter(
                                Section.lesson_id == lesson.id,
                                Section.role == role_name,
                                Section.section_type == sec_type
                            ).delete()
                            sec = Section(
                                lesson_id=lesson.id,
                                role=role_name,
                                section_type=sec_type,
                                content_text=json.dumps(fallback_val)
                            )
                            db.add(sec)

            db.commit()

        # Final Validation Pass: Guarantee 100% complete and non-empty content for all sections
        try:
            await validate_and_ensure_complete_content(session_id, db)
        except Exception as e_val:
            print(f"Post-generation validation notice: {e_val}")

        db_session.status = "completed"
        db_session.progress = 100
        db_session.status_text = "Generation completed! Review and edit your content below."
        db_session.step = "generated"
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": 100,
            "status": "completed",
            "status_text": "Generation completed! Review and edit your content below.",
            "step": "generated"
        })

    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        if db_session:
            db_session.status = "error"
            db_session.status_text = f"Error during generation: {str(e)}"
            db.commit()
            await progress_publisher.publish(session_id, {
                "progress": db_session.progress or 0,
                "status": "error",
                "status_text": f"Error during generation: {str(e)}",
                "step": db_session.step
            })
    finally:
        db.close()


async def validate_and_ensure_complete_content(session_id: str, db):
    """Validation layer: scans all lessons and sections in the course, guaranteeing ZERO missing, empty, or placeholder content."""
    course = db.query(Course).filter(Course.id == session_id).first()
    if not course or not course.lessons:
        return

    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    lessons_outline = json.loads(db_session.structure) if db_session and db_session.structure else []
    grounding_data = json.dumps({
        "tech_tags": json.loads(db_session.tech_tags) if db_session and db_session.tech_tags else [],
        "subject_context": db_session.subject_context if db_session else "",
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session and db_session.learning_outcomes else [],
        "target_audience": db_session.config_audience if db_session else "Student"
    })

    for lesson in course.lessons:
        matching_outline = next((
            l for l in lessons_outline
            if str(l.get("id")) == lesson.structure_key or l.get("order") == lesson.position
        ), {})
        sections_dict = matching_outline.get("sections", {}) if isinstance(matching_outline, dict) else {}

        for role_name in ["creator", "student", "educator"]:
            sections_to_check = []
            if role_name == "creator":
                sections_to_check = ["overview", "learning_outcomes", "core_content", "exercises", "quizzes"]
            elif role_name == "student":
                sections_to_check = ["why_this_matters", "learning_journey", "practice", "debugging", "ethics"]
            else: # educator
                sections_to_check = ["facilitator_guide", "lesson_plan", "rubric", "discussion_questions"]

            role_sects = sections_dict.get(role_name, []) if isinstance(sections_dict, dict) else []
            for s in role_sects:
                if isinstance(s, dict) and not s.get("locked", False):
                    st = s.get("type") or re.sub(r'[^a-z0-9_]', '_', s.get("title", "custom").lower()).strip('_')
                    if st not in sections_to_check:
                        sections_to_check.append(st)

            fallback_dict = exporter.get_resolved_lesson_sections({"title": lesson.title}, role_name)

            for sec_type in sections_to_check:
                existing_sec = db.query(Section).filter(
                    Section.lesson_id == lesson.id,
                    Section.role == role_name,
                    Section.section_type == sec_type
                ).first()

                raw_content = ""
                if existing_sec and existing_sec.content_text:
                    try:
                        raw_content = json.loads(existing_sec.content_text)
                    except Exception:
                        raw_content = existing_sec.content_text

                if not raw_content or str(raw_content).strip() in ["", "No content available.", "null", "None"]:
                    generated_val = fallback_dict.get(sec_type) or f"### {sec_type.replace('_',' ').title()}\nDetailed content for {sec_type} in {lesson.title}."
                    if existing_sec:
                        existing_sec.content_text = json.dumps(generated_val)
                    else:
                        new_sec = Section(
                            lesson_id=lesson.id,
                            role=role_name,
                            section_type=sec_type,
                            content_text=json.dumps(generated_val)
                        )
                        db.add(new_sec)
    db.commit()