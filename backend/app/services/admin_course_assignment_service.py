from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.batch_models import Batch
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


# 2 View Available Trainers
async def get_available_trainers(db):

    result = await db.execute(
        select(User).where(func.upper(User.role) == "TRAINER")
    )

    return result.scalars().all()


# Later you can exclude already assigned trainers if needed.
# 3 View Assigned Trainers
async def get_assigned_trainers(db):

    result = await db.execute(
        select(User)
        .join(Batch, Batch.trainer_id == User.id)
    )

    return result.scalars().all()


