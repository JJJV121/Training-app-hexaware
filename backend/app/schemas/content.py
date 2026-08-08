from pydantic import BaseModel

class ContentResponse(BaseModel):
    id: int
    learning_unit_id: int
    content_text: str

    model_config = {
        "from_attributes": True
    }