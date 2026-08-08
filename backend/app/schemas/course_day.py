from pydantic import BaseModel

class CourseDayResponse(BaseModel):
    id: int
    course_id: int
    day_number: int
    title: str
    description: str | None = None

    model_config = {
        "from_attributes": True
    }