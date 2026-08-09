from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

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
    prefix="/trainer",
    tags=["Trainer Attendance"],
)


# --------------------------------------------------
# Mark Attendance
# --------------------------------------------------

@router.post(
    "/live-sessions/{session_id}/attendance",
    response_model=AttendanceRecordResponse,
)
async def create_attendance_api(
    session_id: int,
    data: AttendanceRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await create_attendance(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
        data=data,
    )


# --------------------------------------------------
# Update Attendance
# --------------------------------------------------

@router.patch(
    "/attendance/{attendance_id}",
    response_model=AttendanceRecordResponse,
)
async def update_attendance_api(
    attendance_id: int,
    data: AttendanceRecordUpdate,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

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
    "/live-sessions/{session_id}/attendance",
    response_model=list[AttendanceRecordResponse],
)
async def get_session_attendance_api(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await get_session_attendance(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )


# --------------------------------------------------
# Get Trainee Attendance
# --------------------------------------------------

@router.get(
    "/trainees/{trainee_id}/attendance",
    response_model=list[AttendanceRecordResponse],
)
async def get_trainee_attendance_api(
    trainee_id: int,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await get_trainee_attendance(
        db=db,
        trainer_id=trainer_id,
        trainee_id=trainee_id,
    )