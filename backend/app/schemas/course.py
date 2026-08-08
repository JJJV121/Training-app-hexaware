from pydantic import BaseModel

class EnrollmentRequest(BaseModel):
    user_id: int
    course_id: int

class CourseCreate(BaseModel):
    title: str
    description: str
    duration_days: int


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    duration_days: int
    thumbnail_url: str | None = None
    is_active: bool

    model_config = {
        "from_attributes": True
    }