from datetime import date, datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    topic: str
    note_text: str
    note_date: date


class NoteUpdate(BaseModel):
    topic: str
    note_text: str
    note_date: date


class NoteResponse(BaseModel):
    id: int
    user_id: int
    topic: str
    note_text: str
    note_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }