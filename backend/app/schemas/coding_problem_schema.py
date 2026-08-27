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
    assignment_id: Optional[int] = None
    title: str
    description: str
    language_id: Optional[int] = None
    marks: Optional[int] = 50
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    deadline: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }