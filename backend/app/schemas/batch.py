from datetime import date, datetime

from pydantic import BaseModel


class BatchBase(BaseModel):
    name: str
    course_id: int
    trainer_id: int
    start_date: date
    end_date: date
    is_active: bool = True


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    name: str | None = None
    course_id: int | None = None
    trainer_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class BatchResponse(BatchBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True