from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.batch_models import (
    Batch,
    BatchTrainee,
)
from app.models.user import User
from app.models.course import Course

# 1 Assign Trainer To Course

async def assign_trainer_course(course_id, trainer_id, db):

    course = await db.get(Course, course_id)

    if not course:
        raise HTTPException(404, "Course not found")

    trainer = await db.get(User, trainer_id)

    if not trainer or trainer.role.upper() != "TRAINER":
        raise HTTPException(404, "Trainer not found")

    course.trainer_id = trainer_id

    await db.commit()
    await db.refresh(course)

    return {"message": "Trainer assigned successfully"}


# 2 Assign Trainer To Batch
async def assign_trainer_batch(batch_id, trainer_id, db):

    batch = await db.get(Batch, batch_id)

    if not batch:
        raise HTTPException(404, "Batch not found")

    trainer = await db.get(User, trainer_id)

    if not trainer or trainer.role.upper() != "TRAINER":
        raise HTTPException(404, "Trainer not found")

    batch.trainer_id = trainer_id

    await db.commit()
    await db.refresh(batch)

    return {"message": "Trainer assigned to batch"}


# 3 Reassign Trainer
async def reassign_trainer(batch_id, trainer_id, db):

    batch = await db.get(Batch, batch_id)

    if not batch:
        raise HTTPException(404, "Batch not found")

    trainer = await db.get(User, trainer_id)

    if not trainer or trainer.role.upper() != "TRAINER":
        raise HTTPException(404, "Trainer not found")

    batch.trainer_id = trainer_id

    await db.commit()
    await db.refresh(batch)

    return {"message": "Trainer reassigned"}


# 4 View Available Trainers
async def get_available_trainers(db):

    result = await db.execute(
        select(User).where(func.upper(User.role) == "TRAINER")
    )

    return result.scalars().all()


# Later you can exclude already assigned trainers if needed.
# 5 View Assigned Trainers
async def get_assigned_trainers(db):

    result = await db.execute(
        select(User)
        .join(Batch, Batch.trainer_id == User.id)
    )

    return result.scalars().all()


# 6 View Course Capacity
# Since Batch has no capacity column yet, assume

capacity = 30
async def get_course_capacity(batch_id, db):

    capacity = 30

    result = await db.execute(
        select(func.count(BatchTrainee.trainee_id))
        .where(BatchTrainee.batch_id == batch_id)
    )

    enrolled = result.scalar()

    return {
        "batch_id": batch_id,
        "capacity": capacity,
        "enrolled": enrolled,
        "remaining": capacity - enrolled
    }


# 7 Remaining Seats
async def get_remaining_seats(batch_id, db):

    capacity = 30

    result = await db.execute(
        select(func.count(BatchTrainee.trainee_id))
        .where(BatchTrainee.batch_id == batch_id)
    )

    enrolled = result.scalar()

    return {
        "remaining": capacity - enrolled
    }


# 8 Update Batch Dates
async def update_batch_dates(batch_id, request, db):

    batch = await db.get(Batch, batch_id)

    if not batch:
        raise HTTPException(404, "Batch not found")

    batch.start_date = request.start_date
    batch.end_date = request.end_date

    await db.commit()
    await db.refresh(batch)

    return batch