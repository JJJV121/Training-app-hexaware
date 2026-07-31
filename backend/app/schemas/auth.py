from pydantic import BaseModel, EmailStr, constr


class ActivateAccountRequest(BaseModel):
    token: str
    password: constr(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginUserResponse(BaseModel):
    id: int
    email: str
    employee_id: str
    role: str | None
    name: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: LoginUserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProfileResponse(BaseModel):
    name: str
    email: str
    model_config = {
        "from_attributes": True
    } 

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str       

'''class RequestActivation(BaseModel):
    email: EmailStr'''