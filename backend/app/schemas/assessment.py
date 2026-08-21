from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


# ----------------------------------------------------
# Trainee-Safe Option Schema (NO is_correct)
# ----------------------------------------------------
class OptionTraineeView(BaseModel):
    id: int
    text: str

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Trainee-Safe Question Schema (NO solution / expected answer key leakage)
# ----------------------------------------------------
class QuestionTraineeView(BaseModel):
    question_id: int
    question_number: int
    question_text: str
    question_type: str  # "mcq", "msq", "true_false", "text", "coding"
    points: int = 1
    options: List[OptionTraineeView] = []

    # Coding problem trainee fields
    title: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    allowed_language: Optional[str] = "python"
    starter_code: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = []  # Non-hidden sample test cases only

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Trainee Proctored Assessment Response
# ----------------------------------------------------
class ProctoredAssessmentTraineeResponse(BaseModel):
    assessment_id: int
    assessment_type: str
    attempt_id: Optional[int] = None
    test_name: str  # course_day_topic e.g. Python_Day_03_Palindromes
    course: str
    day: int
    topic: str
    duration_minutes: int
    total_marks: int
    passing_marks: int
    questions: List[QuestionTraineeView]


class AssessmentSummaryResponse(BaseModel):
    assessment_id: int
    title: str
    assessment_type: str
    day: int
    duration_minutes: int
    total_marks: int
    passing_marks: int


# ----------------------------------------------------
# Attempt Creation & State Models
# ----------------------------------------------------
class CreateAttemptRequest(BaseModel):
    assessment_id: int


class AttemptResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    test_name: str
    course: str
    day: int
    topic: str
    duration_minutes: int
    status: str  # "in_progress", "submitted", "expired"
    started_at: datetime
    expires_at: datetime
    submitted_at: Optional[datetime] = None
    current_question: int = 0
    saved_answers: Dict[Any, Any] = {}  # { question_id: { selected_option_ids: [...], answer_text: "...", code: "...", language: "..." } }
    remaining_seconds: int


# ----------------------------------------------------
# Auto-Save Answer Payload
# ----------------------------------------------------
class SaveAnswerRequest(BaseModel):
    selected_option_ids: Optional[List[int]] = None
    answer_text: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    current_question_index: Optional[int] = None


# ----------------------------------------------------
# Run Code Payload & Response
# ----------------------------------------------------
class RunCodeRequest(BaseModel):
    question_id: int
    language: str
    code: str


class RunCodeResponse(BaseModel):
    status: str  # "passed", "wrong_answer", "compilation_error", "runtime_error", "time_limit_exceeded"
    passed_tests: int
    total_tests: int
    output: str
    execution_time: float = 0.0
    test_results: Optional[List[Dict[str, Any]]] = []


# ----------------------------------------------------
# Proctoring Event Payload
# ----------------------------------------------------
class ProctoringEventRequest(BaseModel):
    event_type: str  # "TAB_SWITCH", "VISIBILITY_CHANGE", "FULLSCREEN_EXIT", "CAMERA_DISABLED"
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# ----------------------------------------------------
# Submission Request Payload
# ----------------------------------------------------
class SubmitAnswerItem(BaseModel):
    question_id: int
    language: Optional[str] = None
    code: Optional[str] = None
    selected_option_ids: Optional[List[int]] = None
    answer_text: Optional[str] = None


class SubmitAttemptRequest(BaseModel):
    answers: Optional[List[SubmitAnswerItem]] = None


# ----------------------------------------------------
# Submission Result Payload
# ----------------------------------------------------
class SubmitAttemptResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    test_name: str
    course: str
    day: int
    topic: str
    score: float
    total_marks: float
    percentage: float
    answered_count: int
    unanswered_count: int
    passed: bool
    status: str
    submitted_at: datetime
