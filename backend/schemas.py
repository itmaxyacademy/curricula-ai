from pydantic import BaseModel
from typing import List, Optional, Any

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Creator"

class LoginRequest(BaseModel):
    email: str
    password: str

class KeywordInput(BaseModel):
    keyword: str

class GroundingInput(BaseModel):
    tech_tags: List[str]
    prerequisites: List[str]
    out_of_scope: List[str]
    learning_outcomes: List[str]
    target_audience: str

class CourseConfigUpdate(BaseModel):
    lessons_count: int
    duration: Any
    difficulty: str
    target_audience: str
    subject_context: str
    tech_tags: Optional[List[str]] = None

class ProposalSelect(BaseModel):
    selected_proposal_id: int

class LessonUpdate(BaseModel):
    id: Any
    title: str
    order: int
    sections: Optional[dict] = None

class StructureUpdate(BaseModel):
    lessons: List[LessonUpdate]

class AIActionRequest(BaseModel):
    role: str
    section_type: str
    action: str
    params: Optional[dict] = None

class SaveSectionRequest(BaseModel):
    role: str
    section_type: str
    content: Optional[Any] = None

class GroundingSuggestRequest(BaseModel):
    field_type: str
    existing_items: List[str]
