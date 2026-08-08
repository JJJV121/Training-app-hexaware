from datetime import datetime
from pydantic import BaseModel


class AssessmentCreate(BaseModel):

    title: str

    description: str | None = None

    course_id: int

    day_id: int | None = None

    duration_minutes: int

    total_marks: int = 100

    pass_percentage: int = 50

    start_time: datetime | None = None

    end_time: datetime | None = None

    created_by: int


class AssessmentResponse(BaseModel):

    id: int

    title: str

    description: str | None

    course_id: int

    day_id: int | None

    duration_minutes: int

    total_marks: int

    pass_percentage: int

    start_time: datetime | None

    end_time: datetime | None

    is_published: bool

    created_by: int

    created_at: datetime

    model_config = {
        "from_attributes": True
    }