from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CodingProblemCreate(BaseModel):
    assignment_id: int
    title: str
    description: str
    language_id: int
    marks: int = 50
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    deadline: datetime | None = None
    created_by: int

class CodingProblemUpdate(BaseModel):
    assignment_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    language_id: Optional[int] = None
    marks: Optional[int] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    deadline: Optional[datetime] = None


class CodingProblemResponse(BaseModel):
    id: int
    assignment_id: int
    title: str
    description: str
    language_id: int
    marks: int
    sample_input: Optional[str]
    sample_output: Optional[str]
    deadline: Optional[datetime]
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }