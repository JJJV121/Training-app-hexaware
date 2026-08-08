from datetime import date

from pydantic import BaseModel


class CurrentCourseResponse(BaseModel):

    course_id: int

    course_name: str

    current_day: int

    duration_days: int

    start_date: date

    end_date: date

    total_units: int

    completed_units: int

    remaining_units: int

    progress_percentage: float

    content_minutes_completed: int
    assessment_time_hours: int
    assignment_time_hours: int


class DashboardResponse(BaseModel):

    employee_id: str

    email: str

    courses_enrolled: int

    current_course: CurrentCourseResponse | None

    model_config = {
        "from_attributes": True
    }