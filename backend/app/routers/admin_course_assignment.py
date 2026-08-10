from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

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


@router.put("/batches/{batch_id}/assign-trainer")
async def assign_trainer_batch(
    batch_id: int,
    request: AssignTrainerBatchRequest,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.assign_trainer_batch(
        batch_id,
        request.trainer_id,
        db
    )


@router.put("/batches/{batch_id}/reassign-trainer")
async def reassign_trainer(
    batch_id: int,
    request: ReassignTrainerRequest,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.reassign_trainer(
        batch_id,
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


@router.get(
    "/batches/{batch_id}/capacity",
    response_model=CapacityResponse
)
async def capacity(
    batch_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_course_capacity(
        batch_id,
        db
    )


@router.get("/batches/{batch_id}/remaining-seats")
async def remaining_seats(
    batch_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_remaining_seats(
        batch_id,
        db
    )


@router.put(
    "/batches/{batch_id}/dates",
    response_model=BatchResponse
)
async def update_dates(
    batch_id: int,
    request: BatchDateUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.update_batch_dates(
        batch_id,
        request,
        db
    )