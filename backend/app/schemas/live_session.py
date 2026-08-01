from datetime import datetime

from pydantic import BaseModel


class LiveSessionBase(BaseModel):
    title: str
    description: str | None = None
    session_type: str
    batch_id: int
    trainer_id: int
    start_time: datetime
    end_time: datetime
    meeting_link: str | None = None


class LiveSessionCreate(LiveSessionBase):
    pass


class LiveSessionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    session_type: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    meeting_link: str | None = None


class LiveSessionResponse(LiveSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True