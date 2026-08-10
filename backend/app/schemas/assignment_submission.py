from datetime import datetime
from app.models.assignment_submission import SubmissionStatus

from pydantic import BaseModel



class AssignmentSubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: str | None = None
    github_url: str | None = None
    submission_path: str | None = None


class AssignmentEvaluation(BaseModel):
    marks: int
    feedback: str | None = None


class AssignmentSubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    user_id: int
    submission_text: str | None
    submission_path: str | None
    github_url: str | None
    status: SubmissionStatus
    marks: int | None
    feedback: str | None
    submitted_at: datetime
    evaluated_by: int | None
    evaluated_at: datetime | None

    class Config:
        from_attributes = True