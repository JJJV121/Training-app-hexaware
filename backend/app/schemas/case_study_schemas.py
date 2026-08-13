from datetime import datetime
from pydantic import BaseModel

class CaseStudyCreate(BaseModel):
    course_day_id: int
    title: str
    scenario: str
    requirements: str
    total_marks: int | None = None
    due_date: datetime | None = None

class CaseStudyUpdate(BaseModel):
    title: str | None = None
    scenario: str | None = None
    requirements: str | None = None
    total_marks: int | None = None
    due_date: datetime | None = None

class CaseStudyResponse(BaseModel):
    id: int
    course_day_id: int
    title: str
    scenario: str
    requirements: str
    total_marks: int | None
    due_date: datetime | None
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
