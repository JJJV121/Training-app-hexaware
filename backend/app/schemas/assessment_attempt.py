from datetime import datetime
from pydantic import BaseModel


class AssessmentAttemptCreate(BaseModel):

    assessment_id: int

    user_id: int


class AssessmentAttemptResponse(BaseModel):

    id: int

    assessment_id: int

    user_id: int

    started_at: datetime

    submitted_at: datetime | None

    score: int

    percentage: float

    passed: bool

    status: str

    model_config = {
        "from_attributes": True
    }


class ViolationRequest(BaseModel):
    violation_type: str