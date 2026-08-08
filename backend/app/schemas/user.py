from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    employee_id: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    employee_id: str
    email: EmailStr
    is_active: bool

    model_config = {
        "from_attributes": True
    }