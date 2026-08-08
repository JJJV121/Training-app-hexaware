from pydantic import BaseModel


class ProgressUpdate(BaseModel):
    user_id: int
    learning_unit_id: int
    is_completed: bool


class ProgressResponse(BaseModel):
    course_id: int
    user_id: int
    total_units: int
    completed_units: int
    progress_percentage: float