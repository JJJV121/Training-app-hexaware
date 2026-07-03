from datetime import date

from pydantic import BaseModel

class DayProgressResponse(BaseModel):

    day: int

    progress_percentage: float

class CurrentCourseResponse(BaseModel):

    course_id: int

    course_name: str

    current_day: int

    day_progress_percentage: float

    duration_days: int

    start_date: date

    end_date: date

    total_modules: int

    completed_modules: int

    remaining_modules: int

    progress_percentage: float

    learning_hours_completed: float

    assessment_time_hours: int

    assignment_time_hours: int

    day_wise_progress: list[DayProgressResponse]


class DashboardResponse(BaseModel):

    name: str | None = None

    employee_id: str

    email: str

    courses_enrolled: int

    current_course: CurrentCourseResponse | None

    model_config = {
        "from_attributes": True
    }