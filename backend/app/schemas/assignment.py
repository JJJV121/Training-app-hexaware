'''from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.assignment import AssignmentType

class AssignmentCreate(BaseModel):
    course_day_id: int
    due_date: datetime
    created_by: int
    assignment_type: str
    total_marks: int
    passing_marks: int
    title: str
    description: Optional[str] = None
    attachment_path: Optional[str] = None
    instructions: Optional[str] = None

class AssignmentCreate(BaseModel):
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    due_date: datetime


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignment_type: AssignmentType | None = None
    instructions: str | None = None
    due_date: datetime | None = None


class AssignmentResponse(BaseModel):
    id: int
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    attachment_path: str | None
    total_marks: int
    passing_marks: int
    due_date: datetime
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True
'''
from datetime import datetime

from pydantic import BaseModel

from app.models.assignment import AssignmentType


class AssignmentCreate(BaseModel):
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    due_date: datetime

    # Your additions
    total_marks: int
    passing_marks: int


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignment_type: AssignmentType | None = None
    instructions: str | None = None
    due_date: datetime | None = None

    # Your additions
    total_marks: int | None = None
    passing_marks: int | None = None


class AssignmentResponse(BaseModel):
    id: int
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    attachment_path: str | None
    total_marks: int
    passing_marks: int
    due_date: datetime
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True