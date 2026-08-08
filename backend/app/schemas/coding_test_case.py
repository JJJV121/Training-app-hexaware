from datetime import datetime

from pydantic import BaseModel


class CodingTestCaseCreate(BaseModel):

    input_data: str

    expected_output: str

    is_hidden: bool = True


class CodingTestCaseResponse(BaseModel):

    id: int

    problem_id: int

    input_data: str

    expected_output: str

    is_hidden: bool

    created_at: datetime

    model_config = {
        "from_attributes": True
    }