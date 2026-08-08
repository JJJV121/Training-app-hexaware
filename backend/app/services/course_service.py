from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.orm import selectinload 
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.video import Video
from app.models.content import Content
from app.models.enrollment import Enrollment
from sqlalchemy import func


async def get_all_courses(
    db: AsyncSession
):
    result = await db.scalars(
        select(Course)
    )

    return result.all()


async def get_course_by_id(
    db: AsyncSession,
    course_id: int
):
    course = await db.scalar(
        select(Course).where(
            Course.id == course_id
        )
    )

    if not course:
        raise ValueError("Course not found")

    return course


async def get_days_by_course(
    db: AsyncSession,
    course_id: int
):
    result = await db.scalars(
        select(CourseDay).where(
            CourseDay.course_id == course_id
        )
    )

    return result.all()


async def get_learning_units_by_day(
    db: AsyncSession,
    day_id: int
):
    result = await db.scalars(
        select(LearningUnit).where(
            LearningUnit.day_id == day_id
        )
    )

    return result.all()


async def get_content_by_learning_unit(
    db: AsyncSession,
    learning_unit_id: int
):
    result = await db.scalars(
        select(Content).where(
            Content.learning_unit_id == learning_unit_id
        )
    )

    return result.all()


async def get_videos_by_learning_unit(
    db: AsyncSession,
    learning_unit_id: int
):
    result = await db.scalars(
        select(Video).where(
            Video.learning_unit_id == learning_unit_id
        )
    )

    return result.all()

async def get_course_content(
    db,
    course_id: int
):
    course = await db.scalar(
        select(Course).where(
            Course.id == course_id
        )
    )

    if not course:
        raise ValueError("Course not found")

    days = (
        await db.scalars(
            select(CourseDay)
            .where(
                CourseDay.course_id == course_id
            )
            .order_by(
                CourseDay.day_number
            )
        )
    ).all()

    result = []

    for day in days:

        units = (
            await db.scalars(
                select(LearningUnit)
                .where(
                    LearningUnit.day_id == day.id
                )
                .order_by(
                    LearningUnit.display_order
                )
            )
        ).all()

        result.append(
            {
                "day_id": day.id,
                "day_number": day.day_number,
                "title": day.title,
                "units": units
            }
        )

    return {
        "course": course,
        "days": result
    }

async def enroll_user_in_course(
    db: AsyncSession,
    user_id: int,
    course_id: int
):

    existing = await db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        )
    )

    if existing:
        raise ValueError(
            "User already enrolled"
        )

    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id
    )

    db.add(enrollment)

    await db.commit()

    await db.refresh(enrollment)

    return enrollment

async def get_user_courses(
    db: AsyncSession,
    user_id: int
):

    result = await db.scalars(
        select(Course)
        .join(
            Enrollment,
            Course.id == Enrollment.course_id
        )
        .where(
            Enrollment.user_id == user_id
        )
    )

    return result.all()

