from datetime import date
from pydantic import BaseModel


class SessionResponse(BaseModel):

    learning_unit_id: int

    title: str

    start_time: str

    end_time: str

    duration_minutes: int

    completed: bool


class ScheduleDayResponse(BaseModel):

    day_number: int

    date: date

    weekday: str

    title: str

    status: str

    sessions: list[SessionResponse]


class ScheduleSummaryResponse(BaseModel):

    total_modules: int

    total_sections: int

    total_days: int

    total_hours: float


class ScheduleResponse(BaseModel):

    course_id: int

    course_name: str

    start_date: date

    end_date: date

    current_day: int

    summary: ScheduleSummaryResponse

    schedule: list[ScheduleDayResponse]

    model_config = {
        "from_attributes": True
    }
