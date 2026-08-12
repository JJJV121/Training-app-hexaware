from pydantic import BaseModel
from app.schemas.course import CourseResponse

class CourseCreate(BaseModel):
    title: str
    description: str
    duration_days: int
    thumbnail_url: str | None = None

class CourseUpdate(BaseModel):
    title: str
    description: str
    duration_days: int
    thumbnail_url: str | None = None


class CourseStatusUpdate(BaseModel):
    is_active: bool


class EnrolledStudentResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class CourseCompletionResponse(BaseModel):
    user_id: int
    employee_id: str
    name: str
    completed_units: int
    total_units: int
    completion_percentage: float