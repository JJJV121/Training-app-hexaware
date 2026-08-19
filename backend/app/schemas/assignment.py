'''from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.assignment import AssignmentType

class AssignmentCreate(BaseModel):
    course_day_id: int
    due_date: datetime
    created_by: int
    assignment_type: str
    total_marks: int
    passing_marks: int
    title: str
    description: Optional[str] = None
    attachment_path: Optional[str] = None
    instructions: Optional[str] = None

class AssignmentCreate(BaseModel):
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    due_date: datetime


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignment_type: AssignmentType | None = None
    instructions: str | None = None
    due_date: datetime | None = None


class AssignmentResponse(BaseModel):
    id: int
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    attachment_path: str | None
    total_marks: int
    passing_marks: int
    due_date: datetime
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True
'''
from datetime import datetime

from pydantic import BaseModel

from app.models.assignment import AssignmentType


class AssignmentCreate(BaseModel):
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    due_date: datetime

    # Your additions
    total_marks: int
    passing_marks: int


class AssignmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignment_type: AssignmentType | None = None
    instructions: str | None = None
    due_date: datetime | None = None

    # Your additions
    total_marks: int | None = None
    passing_marks: int | None = None


class AssignmentResponse(BaseModel):
    id: int
    course_day_id: int
    title: str
    description: str
    assignment_type: AssignmentType
    instructions: str
    attachment_path: str | None
    total_marks: int
    passing_marks: int
    due_date: datetime
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class AssignmentQuestionResponse(BaseModel):
    id: int
    type: str | None = "coding"
    title: str | None = None
    question: str | None = None
    problem_statement: str | None = None
    input_format: str | None = None
    output_format: str | None = None
    constraints: str | None = None
    sample_input: str | None = None
    sample_output: str | None = None
    explanation: str | None = None
    language: str | None = None
    starter_code: str | None = None
    reference_solution: str | None = None
    options: list[str] | None = None
    topic: str | None = None
    difficulty: str | None = None
    test_cases: list[dict] | None = None



from typing import Any

class AssignmentAnswersSubmit(BaseModel):
    user_id: int
    answers: dict[str, Any]  # question_id (as str) -> selected_option_index (int) OR dict / string code



class QuestionResultDetail(BaseModel):
    question_id: int
    question: str
    selected_option: int | None = None
    correct_option: int | None = None
    passed_test_cases: int | None = None
    total_test_cases: int | None = None
    is_correct: bool
    explanation: str | None = None



class AssignmentEvaluationResult(BaseModel):
    submission_id: int
    assignment_id: int
    user_id: int
    score: int
    total_marks: int
    passing_marks: int
    percentage: float
    status: str
    feedback: str
    details: list[QuestionResultDetail]