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


class LearningUnitContentResponse(BaseModel):
    id: int
    title: str
    duration_mins: int | None = None
    display_order: int


class CourseDayContentResponse(BaseModel):
    day_id: int
    day_number: int
    title: str
    learning_units: list[LearningUnitContentResponse]


class CourseContentResponse(BaseModel):
    course_id: int
    course_name: str
    duration_days: int
    days: list[CourseDayContentResponse]

    