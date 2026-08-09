from typing import Literal

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    course_id: int
    role: Literal["admin", "trainer", "trainee"]
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    employee_id: str
    email: EmailStr
    is_active: bool

    model_config = {
        "from_attributes": True
    }