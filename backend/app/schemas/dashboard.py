from datetime import date
from pydantic import BaseModel

class CourseResponse(BaseModel):
    id: int
    name: str
    current_day: int
    total_days: int
    total_modules: int
    completed_modules: int
    remaining_modules: int
    completed_percentage: float
    start_date: date
    end_date: date
    motivation_message: str

class ProgressResponse(BaseModel):
    completed_days: int
    remaining_days: int

class TimeSpentResponse(BaseModel):
    learning_hours: float
    assessment_hours: float
    practice_hours: float
    revision_hours: float

class ContinueLearningResponse(BaseModel):
    course_id: int
    day: int
    module_id: int | None = None

class EnrolledCourseCardResponse(BaseModel):
    course_id: int
    course_name: str
    progress: float
    start_date: date
    end_date: date
    completion_percentage: float

class DashboardResponse(BaseModel):
    name: str | None = None
    employee_id: str
    email: str
    courses_enrolled: int
    course: CourseResponse | None = None
    progress: ProgressResponse | None = None
    time_spent: TimeSpentResponse | None = None
    continue_learning: ContinueLearningResponse | None = None
    enrolled_courses: list[EnrolledCourseCardResponse] = []

    model_config = {
        "from_attributes": True
    }