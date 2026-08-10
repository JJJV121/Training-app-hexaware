from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress


async def are_days_completed(
    db: AsyncSession,
    user_id: int,
    course_id: int,
    start_day: int,
    end_day: int,
) -> bool:
    # Total learning units in the day range
    total_result = await db.execute(
        select(func.count(LearningUnit.id))
        .join(CourseDay, LearningUnit.day_id == CourseDay.id)
        .where(
            CourseDay.course_id == course_id,
            CourseDay.day_number >= start_day,
            CourseDay.day_number <= end_day,
        )
    )

    total_units = total_result.scalar() or 0

    # Completed learning units
    completed_result = await db.execute(
        select(func.count(Progress.id))
        .join(
            LearningUnit,
            Progress.learning_unit_id == LearningUnit.id
        )
        .join(
            CourseDay,
            LearningUnit.day_id == CourseDay.id
        )
        .where(
            Progress.user_id == user_id,
            Progress.is_completed == True,
            CourseDay.course_id == course_id,
            CourseDay.day_number >= start_day,
            CourseDay.day_number <= end_day,
        )
    )

    completed_units = completed_result.scalar() or 0

    return total_units == completed_units


async def is_assignment_unlocked(
    db: AsyncSession,
    assignment: Assignment,
    user_id: int,
) -> bool:

    # Find the assignment's course day
    result = await db.execute(
        select(CourseDay).where(
            CourseDay.id == assignment.course_day_id
        )
    )

    course_day = result.scalar_one_or_none()

    if not course_day:
        return False

    day = course_day.day_number
    course_id = course_day.course_id

    # Day 2 Non-Coding
    if day == 2:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            2,
            2,
        )

    # MySQL Case Study (Days 3-6)
    elif day == 6:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            3,
            6,
        )

    # Core Java Case Study (Days 7-12)
    elif day == 12:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            7,
            12,
        )

    # Project
    elif day == 14:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            14,
            14,
        )

    # Day 15 Non-Coding
    elif day == 15:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            15,
            15,
        )

    # Day 16 Non-Coding
    elif day == 16:
        return await are_days_completed(
            db,
            user_id,
            course_id,
            16,
            16,
        )

    return False