from pydantic import BaseModel


class VideoResponse(BaseModel):
    id: int
    lesson_id: int
    title: str
    video_url: str
    duration_minutes: int

    model_config = {
        "from_attributes": True
    }