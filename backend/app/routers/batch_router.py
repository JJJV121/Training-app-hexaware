from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.batch_schemas import (
    BatchCreate,
    BatchUpdate,
    BatchTraineeAdd,
    BatchTrainerAssign,
)

from app.services.batch_service import (
    create_batch,
    get_all_batches,
    get_batch_by_id,
    update_batch,
    delete_batch,
    assign_trainer,
    add_trainees,
    remove_trainee,
)


router = APIRouter(
    prefix="/admin/batches",
    tags=["Batch Management"],
)


# ============================================================
# CREATE BATCH
# ============================================================

@router.post("")
async def create_batch_route(
    batch: BatchCreate,
    created_by: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_batch(
            db=db,
            created_by=created_by,
            batch=batch,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# GET ALL BATCHES
# ============================================================

@router.get("")
async def get_all_batches_route(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_batches(
        db=db,
        search=search,
        status=status,
        page=page,
        limit=limit,
    )


# ============================================================
# GET BATCH BY ID
# ============================================================

@router.get("/{batch_id}")
async def get_batch_by_id_route(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_batch_by_id(
            db=db,
            batch_id=batch_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# UPDATE BATCH
# ============================================================

@router.put("/{batch_id}")
async def update_batch_route(
    batch_id: int,
    batch: BatchUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_batch(
            db=db,
            batch_id=batch_id,
            batch_data=batch,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# DELETE BATCH
# ============================================================

@router.delete("/{batch_id}")
async def delete_batch_route(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await delete_batch(
            db=db,
            batch_id=batch_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# ASSIGN TRAINER
# ============================================================

@router.post("/{batch_id}/trainer")
async def assign_trainer_route(
    batch_id: int,
    trainer: BatchTrainerAssign,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await assign_trainer(
            db=db,
            batch_id=batch_id,
            trainer_id=trainer.trainer_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# ADD TRAINEES
# ============================================================

@router.post("/{batch_id}/trainees")
async def add_trainees_route(
    batch_id: int,
    trainees: BatchTraineeAdd,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await add_trainees(
            db=db,
            batch_id=batch_id,
            trainee_ids=trainees.trainee_ids,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# REMOVE TRAINEE
# ============================================================

@router.delete("/{batch_id}/trainees/{trainee_id}")
async def remove_trainee_route(
    batch_id: int,
    trainee_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await remove_trainee(
            db=db,
            batch_id=batch_id,
            trainee_id=trainee_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )