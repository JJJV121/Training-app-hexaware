from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

from app.database.session import get_db
from app.core.dependencies import get_current_trainer

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
    current_trainer: User = Depends(get_current_trainer),
):
    return await create_attendance(
        db=db,
        trainer_id=current_trainer.id,
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
    current_trainer: User = Depends(get_current_trainer),
):
    return await update_attendance(
        db=db,
        trainer_id=current_trainer.id,
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
    current_trainer: User = Depends(get_current_trainer),
):
    return await get_session_attendance(
        db=db,
        trainer_id=current_trainer.id,
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
    current_trainer: User = Depends(get_current_trainer),
):
    return await get_trainee_attendance(
        db=db,
        trainer_id=current_trainer.id,
        trainee_id=trainee_id,
    )