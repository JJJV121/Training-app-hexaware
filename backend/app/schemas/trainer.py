from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

class DashboardOverviewResponse(BaseModel):
    assigned_batches: int
    active_batches: int
    inactive_batches: int
    total_trainees: int
    pending_grades: int
    next_session_iso: str | None = None

    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------
# Batch
# --------------------------------------------------

class BatchResponse(BaseModel):
    id: int
    name: str
    course_id: int
    trainer_id: int
    start_date: date
    end_date: date
    is_active: bool
    trainee_count: int
    course_name: str

    model_config = ConfigDict(from_attributes=True)


class BatchDetailResponse(BatchResponse):
    pass


# --------------------------------------------------
# Batch Trainee
# --------------------------------------------------

class BatchTraineeResponse(BaseModel):
    trainee_id: int
    employee_id: str
    name: str | None = None
    email: str
    joined_at: datetime
    progress_pct: float
    attendance_pct: float
    status: str
    progress_label: str

    model_config = ConfigDict(from_attributes=True)