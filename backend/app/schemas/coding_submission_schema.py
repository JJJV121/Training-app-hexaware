from datetime import datetime

from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    problem_id: int
    # user_id: int                 
    # remove after auth is implemented for current_user.id
    source_code: str
    language_id: int


class SubmissionResponse(BaseModel):
    id: int
    problem_id: int
    user_id: int
    source_code: str
    language_id: int
    judge0_token: str | None
    status: str
    score: int
    is_passed: bool
    error_message: str | None
    passed_testcases: int
    total_testcases: int
    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }

class AssignmentResultResponse(BaseModel):
    total_score: int
    passing_marks: int
    status: str

class SubmissionResultResponse(BaseModel):
    submission: SubmissionResponse
    assignment_result: AssignmentResultResponse