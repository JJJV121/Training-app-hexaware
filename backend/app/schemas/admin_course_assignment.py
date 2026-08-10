from datetime import date
from pydantic import BaseModel


class AssignTrainerCourseRequest(BaseModel):
    trainer_id: int
    course_id: int


class AssignTrainerBatchRequest(BaseModel):
    trainer_id: int
    batch_id: int


class ReassignTrainerRequest(BaseModel):
    trainer_id: int


class TrainerResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class BatchResponse(BaseModel):
    id: int
    name: str
    trainer_id: int
    course_id: int
    start_date: date
    end_date: date

    model_config = {
        "from_attributes": True
    }


class CapacityResponse(BaseModel):
    batch_id: int
    capacity: int
    enrolled: int
    remaining: int


class BatchDateUpdate(BaseModel):
    start_date: date
    end_date: date