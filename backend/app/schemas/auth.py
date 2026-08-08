from pydantic import BaseModel, EmailStr, constr


class ActivateAccountRequest(BaseModel):
    token: str
    password: constr(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RequestActivation(BaseModel):
    email: EmailStr