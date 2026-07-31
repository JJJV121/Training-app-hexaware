from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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