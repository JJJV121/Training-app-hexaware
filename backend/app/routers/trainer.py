from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.trainer import (
    DashboardOverviewResponse,
    BatchResponse,
    BatchDetailResponse,
    BatchTraineeResponse,
)

from app.services.trainer_service import (
    get_dashboard_overview,
    get_batches,
    get_batch_by_id,
    get_batch_trainees,
)

router = APIRouter(
    prefix="/trainer",
    tags=["Trainer"],
)


# --------------------------------------------------
# Dashboard Overview
# --------------------------------------------------

@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
)
async def get_dashboard_api(
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await get_dashboard_overview(
        db=db,
        trainer_id=trainer_id,
    )


# --------------------------------------------------
# Get Assigned Batches
# --------------------------------------------------

@router.get(
    "/batches",
    response_model=list[BatchResponse],
)
async def get_batches_api(
    db: AsyncSession = Depends(get_db),
):
    trainer_id = 1

    return await get_batches(
        db=db,
        trainer_id=trainer_id,
    )


# --------------------------------------------------
# Get Batch Details
# --------------------------------------------------

@router.get(
    "/batches/{batch_id}",
    response_model=BatchDetailResponse,
)
async def get_batch_api(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = 1

    return await get_batch_by_id(
        db=db,
        trainer_id=trainer_id,
        batch_id=batch_id,
    )


# --------------------------------------------------
# Get Batch Trainees
# --------------------------------------------------

@router.get(
    "/batches/{batch_id}/trainees",
    response_model=list[BatchTraineeResponse],
)
async def get_batch_trainees_api(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = 1

    return await get_batch_trainees(
        db=db,
        trainer_id=trainer_id,
        batch_id=batch_id,
    )