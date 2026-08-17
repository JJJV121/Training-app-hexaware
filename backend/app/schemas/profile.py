
from pydantic import BaseModel


class ProfileResponse(BaseModel):

    name: str | None = None
    email: str
    model_config = {
        "from_attributes": True
    } 

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str   