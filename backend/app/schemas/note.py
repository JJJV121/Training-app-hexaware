from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str
    content: str
    tag: Optional[str] = None
    pinned: bool = False
    color: str = "#e6f0fa"


class NoteUpdate(BaseModel):
    title: str
    content: str
    tag: Optional[str] = None
    pinned: bool = False
    color: str = "#e6f0fa"


class NoteResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    tag: Optional[str]
    pinned: bool
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CreateNoteResponse(BaseModel):
    message: str
    note: NoteResponse


class UpdateNoteResponse(BaseModel):
    message: str
    note: NoteResponse


class NotesListResponse(BaseModel):
    user_id: int
    notes: list[NoteResponse]


class DeleteNoteResponse(BaseModel):
    message: str