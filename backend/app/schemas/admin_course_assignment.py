from pydantic import BaseModel


class AssignTrainerCourseRequest(BaseModel):
    trainer_id: int
    course_id: int


class TrainerResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }

