from datetime import date

from sqlalchemy import and_, func, or_, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch_models import (
    Batch,
    BatchTrainee,
)
from app.models.course import Course
from app.models.user import User

from app.schemas.batch_schemas import (
    BatchCreate,
    BatchUpdate,
)


# ============================================================
# CREATE BATCH
# ============================================================

def calculate_batch_status(
    start_date: date,
    end_date: date,
) -> str:

    today = date.today()

    if today < start_date:
        return "UPCOMING"

    if today > end_date:
        return "COMPLETED"

    return "ONGOING"

async def create_batch(
    db: AsyncSession,
    created_by: int,
    batch: BatchCreate,
):
    # --------------------------------------------------------
    # Validate Course
    # --------------------------------------------------------

    course = await db.scalar(
        select(Course).where(
            Course.id == batch.course_id
        )
    )

    if not course:
        raise ValueError(
            "Course not found"
        )

    # --------------------------------------------------------
    # Validate Dates
    # --------------------------------------------------------

    if batch.start_date > batch.end_date:
        raise ValueError(
            "Start date cannot be greater than end date"
        )

    # --------------------------------------------------------
    # Validate Time
    # --------------------------------------------------------

    if (
        batch.start_time
        and
        batch.end_time
        and
        batch.start_time >= batch.end_time
    ):
        raise ValueError(
            "Start time must be before end time"
        )

    # --------------------------------------------------------
    # Validate Capacity
    # --------------------------------------------------------

    if batch.max_strength <= 0:
        raise ValueError(
            "Maximum batch strength must be greater than zero"
        )

    # --------------------------------------------------------
    # Create Batch
    # --------------------------------------------------------

    new_batch = Batch(
        name=batch.name,
        course_id=batch.course_id,
        trainer_id=None,
        start_date=batch.start_date,
        end_date=batch.end_date,
        start_time=batch.start_time,
        end_time=batch.end_time,
        max_strength=batch.max_strength,
        status=calculate_batch_status(
            batch.start_date,
            batch.end_date,
        ),
        created_by=created_by,
    )

    db.add(new_batch)

    await db.commit()

    await db.refresh(new_batch)

    return {
        "message": "Batch created successfully",
        "batch": new_batch
    }


# ============================================================
# GET ALL BATCHES
# ============================================================

async def get_all_batches(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    today = date.today()

    stmt = select(Batch)

    # --------------------------------------------------------
    # Search
    # --------------------------------------------------------

    if search:
        stmt = stmt.where(
            Batch.name.ilike(
                f"%{search}%"
            )
        )

    # --------------------------------------------------------
    # Status Filter
    # --------------------------------------------------------

    if status:

        status = status.upper()

        if status == "UPCOMING":

            stmt = stmt.where(
                Batch.start_date > today
            )

        elif status == "ONGOING":

            stmt = stmt.where(
                and_(
                    Batch.start_date <= today,
                    Batch.end_date >= today,
                )
            )

        elif status == "COMPLETED":

            stmt = stmt.where(
                Batch.end_date < today
            )

        else:

            return {
                "total": 0,
                "page": page,
                "limit": limit,
                "batches": [],
            }

    # --------------------------------------------------------
    # Total Count
    # --------------------------------------------------------

    count_stmt = (
        select(func.count())
        .select_from(stmt.subquery())
    )

    total = await db.scalar(count_stmt)

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    stmt = (
        stmt
        .order_by(
            Batch.created_at.desc()
        )
        .offset(
            (page - 1) * limit
        )
        .limit(limit)
    )
    result = await db.scalars(stmt)
    batches = result.all()

    # --------------------------------------------------------
    # Calculate Current Status
    # --------------------------------------------------------

    for batch in batches:
        batch.status = calculate_batch_status(
            batch.start_date,
            batch.end_date,
        )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "batches": batches,
    }

# ============================================================
# GET BATCH BY ID
# ============================================================

async def get_batch_by_id(
    db: AsyncSession,
    batch_id: int,
):
    batch = await db.scalar(
        select(Batch).where(
            Batch.id == batch_id
        )
    )

    if not batch:
        raise ValueError(
            "Batch not found"
        )

    trainee_count = await db.scalar(
        select(func.count())
        .select_from(BatchTrainee)
        .where(
            BatchTrainee.batch_id == batch_id
        )
    )

    batch.status = calculate_batch_status(
        batch.start_date,
        batch.end_date,
    )

    return {
        "batch": batch,
        "batch_strength": trainee_count,
    }


# ============================================================
# UPDATE BATCH
# ============================================================

async def update_batch(
    db: AsyncSession,
    batch_id: int,
    batch_data: BatchUpdate,
):
    batch = await db.scalar(
        select(Batch).where(
            Batch.id == batch_id
        )
    )

    if not batch:
        raise ValueError(
            "Batch not found"
        )

    # --------------------------------------------------------
    # Validate Course
    # --------------------------------------------------------

    if batch_data.course_id is not None:

        course = await db.scalar(
            select(Course).where(
                Course.id == batch_data.course_id
            )
        )

        if not course:
            raise ValueError(
                "Course not found"
            )

        batch.course_id = batch_data.course_id

    # --------------------------------------------------------
    # Batch Name
    # --------------------------------------------------------

    if batch_data.name is not None:
        batch.name = batch_data.name

    # --------------------------------------------------------
    # Trainer
    # --------------------------------------------------------

    if batch_data.trainer_id is not None:
        batch.trainer_id = batch_data.trainer_id

    # --------------------------------------------------------
    # Dates
    # --------------------------------------------------------

    start_date = (
        batch_data.start_date
        if batch_data.start_date is not None
        else batch.start_date
    )

    end_date = (
        batch_data.end_date
        if batch_data.end_date is not None
        else batch.end_date
    )

    if start_date > end_date:
        raise ValueError(
            "Start date cannot be greater than end date"
        )

    batch.start_date = start_date
    batch.end_date = end_date

    # --------------------------------------------------------
    # Time
    # --------------------------------------------------------

    start_time = (
        batch_data.start_time
        if batch_data.start_time is not None
        else batch.start_time
    )

    end_time = (
        batch_data.end_time
        if batch_data.end_time is not None
        else batch.end_time
    )

    if (
        start_time
        and
        end_time
        and
        start_time >= end_time
    ):
        raise ValueError(
            "Start time must be before end time"
        )

    batch.start_time = start_time
    batch.end_time = end_time

    # --------------------------------------------------------
    # Capacity
    # --------------------------------------------------------

    if batch_data.max_strength is not None:

        current_strength = await db.scalar(
            select(func.count())
            .select_from(BatchTrainee)
            .where(
                BatchTrainee.batch_id == batch_id
            )
        )

        if batch_data.max_strength < current_strength:
            raise ValueError(
                "Maximum strength cannot be less than current batch strength"
            )

        batch.max_strength = batch_data.max_strength

    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    batch.status = calculate_batch_status(
        batch.start_date,
        batch.end_date,
    )

    await db.commit()

    await db.refresh(batch)

    return {
        "message": "Batch updated successfully",
        "batch": batch
    }

# ============================================================
# DELETE BATCH
# ============================================================

async def delete_batch(
    db: AsyncSession,
    batch_id: int,
):
    batch = await db.scalar(
        select(Batch).where(
            Batch.id == batch_id
        )
    )

    if not batch:
        raise ValueError("Batch not found")

    # Delete all trainee mappings belonging to this batch
    await db.execute(
        delete(BatchTrainee).where(
            BatchTrainee.batch_id == batch_id
        )
    )

    # Delete the batch
    await db.delete(batch)

    await db.commit()

    return {
        "message": "Batch deleted successfully"
    }

# ============================================================
# ASSIGN TRAINER
# ============================================================

async def assign_trainer(
    db: AsyncSession,
    batch_id: int,
    trainer_id: int,
):
    # --------------------------------------------------------
    # Validate Batch
    # --------------------------------------------------------

    batch = await db.scalar(
        select(Batch).where(
            Batch.id == batch_id
        )
    )

    if not batch:
        raise ValueError(
            "Batch not found"
        )

    # --------------------------------------------------------
    # Validate Trainer
    # --------------------------------------------------------

    trainer = await db.scalar(
        select(User).where(
            User.id == trainer_id
        )
    )

    if not trainer:
        raise ValueError(
            "Trainer not found"
        )

    if not trainer.role or trainer.role.upper() != "TRAINER":
        raise ValueError(
            "Selected user is not a trainer"
        )

    # --------------------------------------------------------
    # Assign Trainer
    # --------------------------------------------------------

    batch.trainer_id = trainer_id

    await db.commit()

    await db.refresh(batch)

    return {
        "message": "Trainer assigned successfully",
        "batch": batch
    }


# ============================================================
# ADD TRAINEES
# ============================================================

async def add_trainees(
    db: AsyncSession,
    batch_id: int,
    trainee_ids: list[int],
):
    # --------------------------------------------------------
    # Validate Batch
    # --------------------------------------------------------

    batch = await db.scalar(
        select(Batch).where(
            Batch.id == batch_id
        )
    )

    if not batch:
        raise ValueError(
            "Batch not found"
        )

    # --------------------------------------------------------
    # Remove Duplicate IDs
    # --------------------------------------------------------

    trainee_ids = list(set(trainee_ids))

    if not trainee_ids:
        raise ValueError(
            "At least one trainee ID is required"
        )

    # --------------------------------------------------------
    # Validate Trainees
    # --------------------------------------------------------

    trainees = await db.scalars(
        select(User).where(
            User.id.in_(trainee_ids)
        )
    )

    trainees = trainees.all()

    if len(trainees) != len(trainee_ids):
        raise ValueError(
            "One or more trainees not found"
        )

    # --------------------------------------------------------
    # Validate Trainee Roles
    # --------------------------------------------------------

    for trainee in trainees:
        if not trainee.role or trainee.role.upper() != "TRAINEE":
            raise ValueError(
                f"User {trainee.id} is not a trainee"
            )

    # --------------------------------------------------------
    # Find Existing Members
    # --------------------------------------------------------

    existing = await db.scalars(
        select(BatchTrainee.trainee_id).where(
            BatchTrainee.batch_id == batch_id,
            BatchTrainee.trainee_id.in_(trainee_ids)
        )
    )

    existing_ids = set(existing.all())

    # --------------------------------------------------------
    # Find Only New Trainees
    # --------------------------------------------------------

    new_trainee_ids = [
        trainee_id
        for trainee_id in trainee_ids
        if trainee_id not in existing_ids
    ]

    # --------------------------------------------------------
    # Already Added
    # --------------------------------------------------------

    if not new_trainee_ids:
        return {
            "message": "All selected trainees are already in the batch"
        }

    # --------------------------------------------------------
    # Current Batch Strength
    # --------------------------------------------------------

    current_strength = await db.scalar(
        select(func.count())
        .select_from(BatchTrainee)
        .where(
            BatchTrainee.batch_id == batch_id
        )
    )

    # --------------------------------------------------------
    # Capacity Validation
    # --------------------------------------------------------

    if current_strength + len(new_trainee_ids) > batch.max_strength:
        raise ValueError(
            "Batch capacity exceeded"
        )

    # --------------------------------------------------------
    # Create Batch-Trainee Records
    # --------------------------------------------------------

    for trainee_id in new_trainee_ids:
        db.add(
            BatchTrainee(
                batch_id=batch_id,
                trainee_id=trainee_id,
            )
        )

    await db.commit()

    return {
        "message": f"{len(new_trainee_ids)} trainee(s) added successfully"
    }


# ============================================================
# REMOVE TRAINEE
# ============================================================

async def remove_trainee(
    db: AsyncSession,
    batch_id: int,
    trainee_id: int,
):
    trainee = await db.scalar(
        select(BatchTrainee).where(
            BatchTrainee.batch_id == batch_id,
            BatchTrainee.trainee_id == trainee_id
        )
    )

    if not trainee:
        raise ValueError(
            "Trainee not found in this batch"
        )

    await db.delete(trainee)

    await db.commit()

    return {
        "message": "Trainee removed successfully"
    }