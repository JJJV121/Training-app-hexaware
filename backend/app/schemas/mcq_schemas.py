from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# QUESTION SCHEMAS
# ==========================================================

class QuestionBase(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    topic: str
    difficulty: str
    marks: int = 1


class QuestionCreate(QuestionBase):
    created_by: int


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[int] = None
    is_active: Optional[bool] = None


class QuestionResponse(QuestionBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# ASSESSMENT SCHEMAS
# ==========================================================

class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    total_questions: int
    pass_percentage: int
    unlock_after_days: int
    topic_distribution: dict


class AssessmentCreate(AssessmentBase):
    created_by: int


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    pass_percentage: Optional[int] = None
    unlock_after_days: Optional[int] = None
    status: Optional[str] = None


class AssessmentResponse(AssessmentBase):
    id: int
    status: str
    created_by: int
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# ATTEMPT SCHEMAS
# ==========================================================

class StartAttemptRequest(BaseModel):
    assessment_id: int
    trainee_id: int


class AutoSaveRequest(BaseModel):
    answers: Dict[str, str]
    remaining_seconds: int


class SubmitAttemptRequest(BaseModel):
    answers: Dict[str, str]


class AttemptResponse(BaseModel):
    id: int
    assessment_id: int
    trainee_id: int
    generated_questions: List[dict]
    answers: Optional[Dict[str, str]]
    remaining_seconds: int
    status: str
    score: Optional[int]
    percentage: Optional[float]
    result: Optional[str]
    started_at: datetime
    submitted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# EVALUATION
# ==========================================================

class EvaluationResponse(BaseModel):
    total_questions: int
    attempted_questions: int
    correct_answers: int
    wrong_answers: int
    score: int
    percentage: float
    result: str


# ==========================================================
# REPORT
# ==========================================================

class ReportResponse(BaseModel):
    trainee_id: int
    assessment_id: int
    score: int
    percentage: float
    result: str
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)