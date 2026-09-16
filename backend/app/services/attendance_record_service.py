from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance_record import AttendanceRecord
from app.models.live_session import LiveSession
from app.schemas.attendance_record import (
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
)


# --------------------------------------------------
# Mark Attendance
# --------------------------------------------------

async def create_attendance(
    db: AsyncSession,
    trainer_id: int,
    data: AttendanceRecordCreate,
):
    session_id = data.session_id
    # Check that the session belongs to this trainer
    result = await db.execute(
        select(LiveSession).where(
            LiveSession.id == session_id,
            LiveSession.trainer_id == trainer_id,
        )
    )

    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Live session not found.",
        )

    # Check whether attendance is already marked
    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.trainee_id == data.trainee_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Attendance already marked for this trainee.",
        )

    attendance = AttendanceRecord(
        session_id=session_id,
        trainee_id=data.trainee_id,
        status=data.status,
    )

    db.add(attendance)

    await db.commit()
    await db.refresh(attendance)

    # Trigger attendance follow-up automation evaluation for eligible candidates
    try:
        from app.services.attendance_followup_service import process_attendance_event
        await process_attendance_event(
            db=db,
            trainee_id=data.trainee_id,
            session_id=session_id,
            marked_status=data.status,
            actor_id=trainer_id,
        )
    except Exception as e:
        print(f"Attendance follow-up event trigger notice: {e}")

    return attendance


# --------------------------------------------------
# Update Attendance
# --------------------------------------------------

async def update_attendance(
    db: AsyncSession,
    trainer_id: int,
    attendance_id: int,
    data: AttendanceRecordUpdate,
):
    result = await db.execute(
        select(AttendanceRecord)
        .join(
            LiveSession,
            LiveSession.id == AttendanceRecord.session_id,
        )
        .where(
            AttendanceRecord.id == attendance_id,
            LiveSession.trainer_id == trainer_id,
        )
    )

    attendance = result.scalar_one_or_none()

    if attendance is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found.",
        )

    attendance.status = data.status

    await db.commit()
    await db.refresh(attendance)

    # Trigger attendance follow-up automation evaluation for eligible candidates
    try:
        from app.services.attendance_followup_service import process_attendance_event
        await process_attendance_event(
            db=db,
            trainee_id=attendance.trainee_id,
            session_id=attendance.session_id,
            marked_status=data.status,
            actor_id=trainer_id,
        )
    except Exception as e:
        print(f"Attendance follow-up event trigger notice on update: {e}")

    return attendance


# --------------------------------------------------
# Get Attendance For A Live Session
# --------------------------------------------------

async def get_session_attendance(
    db: AsyncSession,
    trainer_id: int,
    session_id: int,
):
    # Verify that the session belongs to this trainer
    result = await db.execute(
        select(LiveSession).where(
            LiveSession.id == session_id,
            LiveSession.trainer_id == trainer_id,
        )
    )

    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Live session not found.",
        )

    result = await db.execute(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.session_id == session_id
        )
        .order_by(
            AttendanceRecord.marked_at
        )
    )

    return result.scalars().all()


# --------------------------------------------------
# Get Trainee Attendance History
# --------------------------------------------------

async def get_trainee_attendance(
    db: AsyncSession,
    trainer_id: int,
    trainee_id: int,
):
    result = await db.execute(
        select(AttendanceRecord)
        .join(
            LiveSession,
            LiveSession.id == AttendanceRecord.session_id,
        )
        .where(
            AttendanceRecord.trainee_id == trainee_id,
            LiveSession.trainer_id == trainer_id,
        )
        .order_by(
            AttendanceRecord.marked_at.desc()
        )
    )

    return result.scalars().all()