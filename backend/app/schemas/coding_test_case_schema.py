from pydantic import BaseModel


class TestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = True


class TestCaseResponse(BaseModel):
    id: int
    problem_id: int
    input_data: str
    expected_output: str
    is_hidden: bool

    model_config = {
        "from_attributes": True
    }