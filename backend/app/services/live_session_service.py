from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.batch import Batch

from app.models.live_session import LiveSession
from app.schemas.live_session import (
    LiveSessionCreate,
    LiveSessionUpdate,
)


# --------------------------------------------------
# Create Live Session
# --------------------------------------------------

async def create_live_session(
    db: AsyncSession,
    trainer_id: int,
    data: LiveSessionCreate,
):
    result = await db.execute(
        select(Batch).where(Batch.id == data.batch_id)
    )

    batch = result.scalar_one_or_none()

    if batch is None:
        raise HTTPException(
            status_code=404,
            detail=f"Batch with ID {data.batch_id} does not exist.",
        )

    session = LiveSession(
        title=data.title,
        description=data.description,
        session_type=data.session_type,
        batch_id=data.batch_id,
        trainer_id=trainer_id,
        start_time=data.start_time,
        end_time=data.end_time,
        meeting_link=data.meeting_link,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


# --------------------------------------------------
# Get Trainer Live Sessions
# --------------------------------------------------

async def get_live_sessions(
    db: AsyncSession,
    trainer_id: int,
):
    result = await db.execute(
        select(LiveSession)
        .where(
            LiveSession.trainer_id == trainer_id
        )
        .order_by(
            LiveSession.start_time.desc()
        )
    )

    return result.scalars().all()


# --------------------------------------------------
# Get Live Session By ID
# --------------------------------------------------

async def get_live_session_by_id(
    db: AsyncSession,
    trainer_id: int,
    session_id: int,
):
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

    return session


# --------------------------------------------------
# Update Live Session
# --------------------------------------------------

async def update_live_session(
    db: AsyncSession,
    trainer_id: int,
    session_id: int,
    data: LiveSessionUpdate,
):
    session = await get_live_session_by_id(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)

    return session


# --------------------------------------------------
# Delete Live Session
# --------------------------------------------------

async def delete_live_session(
    db: AsyncSession,
    trainer_id: int,
    session_id: int,
):
    session = await get_live_session_by_id(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )

    # Delete associated attendance records first
    from sqlalchemy import delete
    from app.models.attendance_record import AttendanceRecord
    await db.execute(
        delete(AttendanceRecord).where(AttendanceRecord.session_id == session_id)
    )

    await db.delete(session)
    await db.commit()

    return {
        "message": "Live session deleted successfully."
    }


# --------------------------------------------------
# Get Upcoming Sessions
# --------------------------------------------------

async def get_upcoming_sessions(
    db: AsyncSession,
    trainer_id: int,
):
    from datetime import datetime
    result = await db.execute(
        select(LiveSession)
        .where(
            LiveSession.trainer_id == trainer_id,
            LiveSession.start_time >= datetime.utcnow(),
        )
        .order_by(
            LiveSession.start_time.asc()
        )
    )

    return result.scalars().all()