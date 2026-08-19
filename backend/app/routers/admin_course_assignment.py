from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.admin_course_assignment import (
    AssignTrainerCourseRequest,
    TrainerResponse,
)

from app.services import admin_course_assignment_service as admin_service


router = APIRouter(
    prefix="/admin",
    tags=["Admin Course Assignment"]
)

@router.put("/courses/{course_id}/assign-trainer")
async def assign_trainer_course(
    course_id: int,
    request: AssignTrainerCourseRequest,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.assign_trainer_course(
        course_id,
        request.trainer_id,
        db
    )


@router.get(
    "/trainers/available",
    response_model=list[TrainerResponse]
)
async def available_trainers(
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_available_trainers(db)


@router.get(
    "/trainers/assigned",
    response_model=list[TrainerResponse]
)
async def assigned_trainers(
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_assigned_trainers(db)


