from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True)
    title = Column(String(200))
    description = Column(Text, nullable=True)
    difficulty = Column(String(50))
    duration = Column(Integer)
    audience = Column(String(100))
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    title = Column(String(200))
    position = Column(Integer)
    course = relationship("Course", back_populates="lessons")
    sections = relationship("Section", back_populates="lesson", cascade="all, delete-orphan")
    pptx = relationship("Pptx", back_populates="lesson", uselist=False, cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    role = Column(String(20))
    section_type = Column(String(100))
    content_text = Column(Text)
    lesson = relationship("Lesson", back_populates="sections")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True)
    step = Column(String(30), default="dashboard")
    prompt = Column(Text, nullable=True)
    tech_tags = Column(Text, default="[]")
    config_lessons = Column(Integer, default=5)
    config_duration = Column(Integer, default=60)
    config_difficulty = Column(String(30), default="Beginner")
    config_audience = Column(String(100), default="Student")
    subject_context = Column(Text, default="")
    document_context = Column(Text, nullable=True)
    document_filename = Column(String(200), nullable=True)
    prerequisites = Column(Text, default="[]")
    boundaries = Column(Text, default="[]")
    learning_outcomes = Column(Text, default="[]")
    proposals = Column(Text, default="[]")
    selected_proposal_id = Column(Integer, nullable=True)
    structure = Column(Text, default="[]")
    status = Column(String(30), default="idle")
    progress = Column(Integer, default=0)
    status_text = Column(Text, default="")
    created_at = Column(String(32), nullable=True)
    all_suggested_tags = Column(Text, default="[]")


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    role = Column(String(20), nullable=True)
    section_type = Column(String(100), nullable=True)
    content_snapshot = Column(Text)
    label = Column(String(100), nullable=True)
    created_at = Column(String(32))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Creator", nullable=True)
    created_at = Column(String(32), nullable=True)


class Pptx(Base):
    __tablename__ = "pptx"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), unique=True, index=True)
    layouts_json = Column(Text)
    selected_layout = Column(String(20), default="layout_1")
    brand_colors = Column(String(50), nullable=True)
    created_at = Column(String(32))
    lesson = relationship("Lesson", back_populates="pptx")
