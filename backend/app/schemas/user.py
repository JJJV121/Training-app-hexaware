from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserCreate(BaseModel):
    employee_id: str
    email: EmailStr
    role: UserRole = UserRole.TRAINEE


class UserResponse(BaseModel):
    id: int
    employee_id: str
    email: EmailStr
    is_active: bool
    role: UserRole

    model_config = {
        "from_attributes": True
    }