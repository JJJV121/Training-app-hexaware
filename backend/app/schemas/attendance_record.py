from datetime import datetime

from pydantic import BaseModel

from app.models.attendance_record import AttendanceStatus


class AttendanceRecordBase(BaseModel):
    session_id: int
    trainee_id: int
    status: AttendanceStatus


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecordUpdate(BaseModel):
    status: AttendanceStatus


class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    marked_at: datetime

    class Config:
        from_attributes = True