from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User

from app.database.session import get_db

from app.schemas.attendance_record import (
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
    AttendanceRecordResponse,
)

from app.services.attendance_record_service import (
    create_attendance,
    update_attendance,
    get_session_attendance,
    get_trainee_attendance,
)


router = APIRouter(
    prefix="/api/trainer/attendance",
    tags=["Trainer Attendance"],
)


async def get_trainer_id(db: AsyncSession) -> int:
    result = await db.execute(
        select(User.id).where(func.lower(User.role) == "trainer").order_by(User.id)
    )
    trainer_id = result.scalar()
    return trainer_id or 1


# --------------------------------------------------
# Mark Attendance
# --------------------------------------------------

@router.post(
    "",
    response_model=AttendanceRecordResponse,
)
async def create_attendance_api(
    data: AttendanceRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await create_attendance(
        db=db,
        trainer_id=trainer_id,
        data=data,
    )


# --------------------------------------------------
# Update Attendance
# --------------------------------------------------

@router.put(
    "/{attendance_id}",
    response_model=AttendanceRecordResponse,
)
async def update_attendance_api(
    attendance_id: int,
    data: AttendanceRecordUpdate,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await update_attendance(
        db=db,
        trainer_id=trainer_id,
        attendance_id=attendance_id,
        data=data,
    )


# --------------------------------------------------
# Get Session Attendance
# --------------------------------------------------

@router.get(
    "/session/{session_id}",
    response_model=list[AttendanceRecordResponse],
)
async def get_session_attendance_api(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await get_session_attendance(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )


# --------------------------------------------------
# Get Trainee Attendance
# --------------------------------------------------

@router.get(
    "/trainee/{trainee_id}",
    response_model=list[AttendanceRecordResponse],
)
async def get_trainee_attendance_api(
    trainee_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await get_trainee_attendance(
        db=db,
        trainer_id=trainer_id,
        trainee_id=trainee_id,
    )