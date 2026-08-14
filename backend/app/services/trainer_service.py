from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch_models import Batch

from app.models.user import User


# --------------------------------------------------
# Dashboard Overview
# --------------------------------------------------

async def get_dashboard_overview(
    db: AsyncSession,
    trainer_id: int,
):
    # Total batches assigned
    total_batches_result = await db.execute(
        select(func.count(Batch.id)).where(
            Batch.trainer_id == trainer_id
        )
    )

    assigned_batches = total_batches_result.scalar() or 0

    # Active batches
    active_batches_result = await db.execute(
        select(func.count(Batch.id)).where(
            Batch.trainer_id == trainer_id,
            Batch.is_active == True,
        )
    )

    active_batches = active_batches_result.scalar() or 0

    # Inactive batches
    inactive_batches = assigned_batches - active_batches

    # Total trainees under this trainer
    trainee_result = await db.execute(
        select(func.count(BatchTrainee.trainee_id))
        .join(
            Batch,
            Batch.id == BatchTrainee.batch_id,
        )
        .where(
            Batch.trainer_id == trainer_id
        )
    )

    total_trainees = trainee_result.scalar() or 0

    return {
        "assigned_batches": assigned_batches,
        "active_batches": active_batches,
        "inactive_batches": inactive_batches,
        "total_trainees": total_trainees,
    }


# --------------------------------------------------
# Get Trainer Batches
# --------------------------------------------------

async def get_batches(
    db: AsyncSession,
    trainer_id: int,
):
    result = await db.execute(
        select(Batch)
        .where(
            Batch.trainer_id == trainer_id
        )
        .order_by(
            Batch.start_date.desc()
        )
    )

    return result.scalars().all()


# --------------------------------------------------
# Get Batch By ID
# --------------------------------------------------

async def get_batch_by_id(
    db: AsyncSession,
    trainer_id: int,
    batch_id: int,
):
    result = await db.execute(
        select(Batch).where(
            Batch.id == batch_id,
            Batch.trainer_id == trainer_id,
        )
    )

    batch = result.scalar_one_or_none()

    if batch is None:
        raise HTTPException(
            status_code=404,
            detail="Batch not found."
        )

    return batch


# --------------------------------------------------
# Get Batch Trainees
# --------------------------------------------------

async def get_batch_trainees(
    db: AsyncSession,
    trainer_id: int,
    batch_id: int,
):
    # Validate trainer owns this batch
    await get_batch_by_id(
        db=db,
        trainer_id=trainer_id,
        batch_id=batch_id,
    )

    result = await db.execute(
        select(
            User.id,
            User.employee_id,
            User.name,
            User.email,
            BatchTrainee.joined_at,
        )
        .join(
            BatchTrainee,
            User.id == BatchTrainee.trainee_id,
        )
        .where(
            BatchTrainee.batch_id == batch_id,
        )
        .order_by(
            User.name,
        )
    )

    trainees = result.all()

    return [
        {
            "trainee_id": trainee.id,
            "employee_id": trainee.employee_id,
            "name": trainee.name,
            "email": trainee.email,
            "joined_at": trainee.joined_at,
        }
        for trainee in trainees
    ]
