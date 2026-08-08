from datetime import datetime
from pydantic import BaseModel


class CodingSubmissionCreate(BaseModel):

    attempt_id: int

    coding_problem_id: int

    source_code: str

    language: str


class CodingSubmissionResponse(BaseModel):

    id: int

    attempt_id: int

    coding_problem_id: int

    passed_testcases: int

    total_testcases: int

    score: int


    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }