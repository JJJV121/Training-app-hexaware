from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    id: int
    employee_id: str
    name: str | None = None
    email: EmailStr
    course_id: int | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class TrainerCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    course_id: int
    password: str


class TraineeCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    course_id: int


class AdminUserUpdate(BaseModel):
    employee_id: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    course_id: int | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool