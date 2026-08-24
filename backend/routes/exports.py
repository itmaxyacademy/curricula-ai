import datetime
import io
import json
import re
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Session as DbSession, Course, Lesson, Section, Pptx
import exporter
import pipeline

router = APIRouter(prefix="/api/v1/courses", tags=["exports"])


def make_safe_attachment_header(base_name: str, ext: str, disp_type: str = "attachment") -> dict:
    """Builds standard RFC 5987 Content-Disposition headers to guarantee proper file extension in Windows Chrome."""
    clean_ascii = re.sub(r"[^\w\-.]", "_", base_name).strip("_") or "Course"
    full_filename = f"{clean_ascii}.{ext}"
    encoded_filename = urllib.parse.quote(f"{base_name}.{ext}")
    return {
        "Content-Disposition": f'{disp_type}; filename="{full_filename}"; filename*=UTF-8\'\'{encoded_filename}'
    }


@router.get("/{session_id}/export/{filename_param}")
@router.get("/{session_id}/export")
def export_course(
    session_id: str,
    filename_param: Optional[str] = None,
    format: str = "pdf",
    role: str = "all",
    lesson_id: Optional[str] = None,
    disposition: str = "inline",
    db: Session = Depends(get_db)
):
    if filename_param:
        if filename_param.endswith(".zip"):
            format = "zip"
        elif filename_param.endswith(".docx"):
            format = "docx"
        elif filename_param.endswith(".html"):
            format = "html"
        elif filename_param.endswith(".md") or filename_param.endswith(".markdown"):
            format = "md"
        elif filename_param.endswith(".pdf"):
            format = "pdf"

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

    if lesson_id:
        filtered = [l for l in lessons_data if str(l["id"]) == str(lesson_id)]
        if filtered:
            lessons_data = filtered

    course_title = course.title if course else (db_session.prompt or "Untitled Course")
    if not lessons_data:
        lessons_data = [{
            "id": 1,
            "title": course_title,
            "order": 1,
            "sections": {}
        }]

    course_data = {
        "title": course_title,
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "structure": json.loads(db_session.structure) if (db_session and db_session.structure) else [],
        "lessons": lessons_data
    }

    clean_base = re.sub(r"[^\w\-.]", "_", course_title).strip("_") or "Course"
    disp_type = "attachment" if (format in ["zip", "docx", "md", "markdown"] or disposition == "attachment") else "inline"

    if format == "zip":
        stream = exporter.export_all_zip(course_data)
        return StreamingResponse(
            stream,
            media_type="application/zip",
            headers=make_safe_attachment_header(f"{clean_base}_export", "zip", "attachment")
        )
    elif format == "docx":
        stream = exporter.export_to_docx(course_data, role)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=make_safe_attachment_header(f"{clean_base}_{role}", "docx", "attachment")
        )
    elif format == "html":
        html_str = exporter.export_to_html(course_data, role)
        stream = io.BytesIO(html_str.encode("utf-8"))
        return StreamingResponse(
            stream,
            media_type="text/html",
            headers=make_safe_attachment_header(f"{clean_base}_{role}", "html", disp_type)
        )
    elif format in ["md", "markdown"]:
        md_str = exporter.export_to_markdown(course_data, role)
        stream = io.BytesIO(md_str.encode("utf-8"))
        return StreamingResponse(
            stream,
            media_type="text/markdown",
            headers=make_safe_attachment_header(f"{clean_base}_{role}", "md", disp_type)
        )
    else:  # default pdf
        stream = exporter.export_to_pdf(course_data, role)
        return StreamingResponse(
            stream,
            media_type="application/pdf",
            headers=make_safe_attachment_header(f"{clean_base}_{role}", "pdf", disp_type)
        )


@router.post("/{session_id}/pptx/generate")
async def generate_pptx_endpoint(session_id: str, req_body: dict = None, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    brand_colors = (req_body or {}).get("brand_colors", None)
    role = ((req_body or {}).get("role") or "student").lower()

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

    course_data = {
        "title": course.title if course else (db_session.prompt or "Untitled Course"),
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "structure": json.loads(db_session.structure) if (db_session and db_session.structure) else [],
        "subject_context": db_session.subject_context or "",
        "lessons": lessons_data
    }

    pptx_structure = await pipeline.generate_pptx_structure(course_data, brand_colors, role)
    return pptx_structure


@router.post("/{session_id}/pptx/generate/lesson/{lesson_id}")
async def generate_lesson_pptx_endpoint(session_id: str, lesson_id: int, req_body: dict = None, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == session_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    brand_colors = (req_body or {}).get("brand_colors", None)
    role = ((req_body or {}).get("role") or "student").lower()

    sections_data = {}
    for sec in lesson.sections:
        if sec.role not in sections_data:
            sections_data[sec.role] = {}
        try:
            sections_data[sec.role][sec.section_type] = json.loads(sec.content_text)
        except Exception:
            sections_data[sec.role][sec.section_type] = sec.content_text

    course = db.query(Course).filter(Course.id == session_id).first()
    lesson_data = {
        "id": lesson.id,
        "title": lesson.title,
        "order": lesson.position,
        "sections": sections_data
    }

    course_data = {
        "title": f"{course.title if course else (db_session.prompt or 'Untitled Course')} — {lesson.title}",
        "config": {
            "lessons_count": 1,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "structure": json.loads(db_session.structure) if (db_session and db_session.structure) else [],
        "subject_context": db_session.subject_context or "",
        "lessons": [lesson_data]
    }

    pptx_structure = await pipeline.generate_pptx_structure(course_data, brand_colors, role)

    layouts_json = json.dumps(pptx_structure.get("layouts", {}))
    pptx = db.query(Pptx).filter(Pptx.lesson_id == lesson_id).first()
    if not pptx:
        pptx = Pptx(lesson_id=lesson_id)
        db.add(pptx)
    pptx.layouts_json = layouts_json
    pptx.selected_layout = "layout_1"
    pptx.brand_colors = json.dumps(brand_colors) if isinstance(brand_colors, dict) else brand_colors
    pptx.created_at = datetime.datetime.utcnow().isoformat()
    db.commit()

    return pptx_structure


@router.post("/{session_id}/pptx/download/lesson/{lesson_id}")
async def download_lesson_pptx_endpoint(session_id: str, lesson_id: int, req_body: dict = None, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == session_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    layout = (req_body or {}).get("layout", "layout_1")
    slides_json = (req_body or {}).get("slides_json", None)
    brand_colors = (req_body or {}).get("brand_colors", None)

    if not slides_json:
        pptx = db.query(Pptx).filter(Pptx.lesson_id == lesson_id).first()
        if pptx:
            layouts = json.loads(pptx.layouts_json)
            slides_json = layouts.get(layout)
            if slides_json:
                saved_colors = pptx.brand_colors
                if saved_colors and isinstance(saved_colors, str):
                    try:
                        brand_colors = json.loads(saved_colors)
                    except Exception:
                        brand_colors = saved_colors
                elif saved_colors:
                    brand_colors = saved_colors

    if not slides_json:
        raise HTTPException(status_code=400, detail="slides_json is required. Call /pptx/generate/lesson/{lesson_id} first.")

    stream = exporter.create_pptx_from_structure(slides_json, layout, brand_colors)
    course_title = db_session.prompt or "Course"
    lesson_title = lesson.title
    filename_title = re.sub(r"[^\w\-.]", "_", f"{course_title}_{lesson_title}").strip("_")

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers=make_safe_attachment_header(f"{filename_title}_slides", "pptx", "attachment")
    )


@router.post("/{session_id}/pptx/download")
async def download_pptx_endpoint(session_id: str, req_body: dict = None, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    layout = (req_body or {}).get("layout", "layout_1")
    slides_json = (req_body or {}).get("slides_json", None)
    brand_colors = (req_body or {}).get("brand_colors", None)

    if not slides_json:
        raise HTTPException(status_code=400, detail="slides_json is required. Call /pptx/generate first.")

    stream = exporter.create_pptx_from_structure(slides_json, layout, brand_colors)
    course_title = db_session.prompt or "Course"
    filename_title = re.sub(r"[^\w\-.]", "_", course_title).strip("_")

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers=make_safe_attachment_header(f"{filename_title}_slides", "pptx", "attachment")
    )