from datetime import datetime
from pydantic import BaseModel

class CourseDayQACreate(BaseModel):
    course_day_id: int
    question: str
    answer: str | None = None

class CourseDayQAUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None

class CourseDayQAResponse(BaseModel):
    id: int
    course_day_id: int
    question: str
    answer: str | None
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
