from datetime import datetime, timezone

from pydantic import BaseModel, field_validator


class LiveSessionBase(BaseModel):
    title: str
    description: str | None = None
    session_type: str
    batch_id: int
    trainer_id: int
    start_time: datetime
    end_time: datetime
    meeting_link: str | None = None

    @field_validator("start_time", "end_time")
    @classmethod
    def make_naive(cls, value: datetime) -> datetime:
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value


class LiveSessionCreate(LiveSessionBase):
    pass


class LiveSessionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    session_type: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    meeting_link: str | None = None

    @field_validator("start_time", "end_time")
    @classmethod
    def make_naive(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value


class LiveSessionResponse(LiveSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True