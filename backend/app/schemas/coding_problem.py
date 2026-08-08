from datetime import datetime

from pydantic import BaseModel


class CodingProblemCreate(BaseModel):

    title: str

    description: str

    difficulty: str

    language: str

    starter_code: str | None = None

    sample_input: str | None = None

    sample_output: str | None = None

    constraints: str | None = None

    created_by: int


class CodingProblemResponse(BaseModel):

    id: int

    title: str

    description: str

    difficulty: str

    language: str

    starter_code: str | None

    sample_input: str | None

    sample_output: str | None

    constraints: str | None

    created_by: int

    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class CodingProblemUpdate(BaseModel):

    title: str | None = None

    description: str | None = None

    difficulty: str | None = None

    language: str | None = None

    starter_code: str | None = None

    sample_input: str | None = None

    sample_output: str | None = None

    constraints: str | None = None