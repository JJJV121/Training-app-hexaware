from datetime import datetime
from pydantic import BaseModel, Field


class AbsenceReasonSubmit(BaseModel):
    followup_id: int
    reason_category: str = Field(..., example="Medical Emergency")
    reason_description: str = Field(..., example="Hospitalized for fever")
    reason_attachment_url: str | None = None


class SPOCReviewSubmit(BaseModel):
    followup_id: int
    decision: str = Field(..., example="APPROVE")  # APPROVE or REJECT
    spoc_comments: str | None = None


class CandidateEligibilityToggle(BaseModel):
    candidate_id: int
    enabled: bool


class GlobalAutomationToggle(BaseModel):
    enabled: bool


class AttendanceFollowupResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str | None = None
    candidate_email: str | None = None
    employee_id: str | None = None
    batch_id: int
    batch_name: str | None = None
    course_id: int
    course_name: str | None = None
    current_stage: str
    consecutive_absence_count: int
    first_absence_date: datetime | None = None
    latest_absence_date: datetime | None = None
    reminder_1_sent_at: datetime | None = None
    reminder_2_sent_at: datetime | None = None
    warning_sent_at: datetime | None = None
    reason_submitted_at: datetime | None = None
    reason_category: str | None = None
    reason_description: str | None = None
    reason_attachment_url: str | None = None
    spoc_reviewed_at: datetime | None = None
    spoc_id: int | None = None
    spoc_decision: str | None = None
    spoc_comments: str | None = None
    discontinued_at: datetime | None = None
    cr_notified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
