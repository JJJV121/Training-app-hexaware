from pydantic import BaseModel


class ProgressUpdate(BaseModel):
    user_id: int
    learning_unit_id: int
    is_completed: bool


class DayProgressResponse(BaseModel):
    day_number: int
    total_units: int
    completed_units: int
    progress_percentage: float


class ProgressResponse(BaseModel):
    course_id: int
    user_id: int

    total_units: int
    completed_units: int
    progress_percentage: float

    completed_learning_units: list[int]
    completed_videos: list[int]

    day_progress: list[DayProgressResponse]