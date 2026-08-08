from pydantic import BaseModel

class LearningUnitResponse(BaseModel):
    id: int
    day_id: int
    title: str
    description: str | None = None
    display_order: int
    duration_minutes: int | None = None

    model_config = {
        "from_attributes": True
    }