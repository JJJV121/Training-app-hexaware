from datetime import datetime
from pydantic import BaseModel, Field


# ----------------------------------------------------
# Trainee-Safe Option Schema (NO is_correct)
# ----------------------------------------------------
class OptionTraineeView(BaseModel):
    id: int
    text: str

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Trainee-Safe Question Schema (NO correct answer or explanation)
# ----------------------------------------------------
class QuestionTraineeView(BaseModel):
    question_id: int
    question_number: int
    question_text: str
    question_type: str  # "mcq", "msq", "true_false", "text"
    points: int = 1
    options: list[OptionTraineeView] = []

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Trainee Proctored Assessment Response
# ----------------------------------------------------
class ProctoredAssessmentTraineeResponse(BaseModel):
    assessment_id: int
    attempt_id: int | None = None
    test_name: str  # course_day_topic e.g. Python_Day_03_Functions
    course: str
    day: int
    topic: str
    duration_minutes: int
    total_marks: int
    passing_marks: int
    questions: list[QuestionTraineeView]


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
    submitted_at: datetime | None = None
    current_question: int = 0
    saved_answers: dict = {}  # { question_id: { selected_option_ids: [...], answer_text: "..." } }
    remaining_seconds: int


# ----------------------------------------------------
# Auto-Save Answer Payload
# ----------------------------------------------------
class SaveAnswerRequest(BaseModel):
    selected_option_ids: list[int] | None = None
    answer_text: str | None = None
    current_question_index: int | None = None


# ----------------------------------------------------
# Proctoring Event Payload
# ----------------------------------------------------
class ProctoringEventRequest(BaseModel):
    event_type: str  # "TAB_SWITCH", "VISIBILITY_CHANGE", "FULLSCREEN_EXIT", "CAMERA_DISABLED"
    timestamp: str | None = None
    metadata: dict | None = None


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
