from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException
from app.models.batch_models import Batch
from app.models.user import User
from app.models.course import Course
from app.models.progress import Progress
from app.models.course_day import CourseDay
from app.models.enrollment import Enrollment
from app.models.learning_unit import LearningUnit

from app.schemas.course import CourseCreate
from app.schemas.admin_course import CourseUpdate
from app.utils.cache_utils import cache_get, cache_set, clear_admin_courses_cache, clear_course_cache


# 1. Create Course
async def create_course(
    db: AsyncSession,
    course: CourseCreate
):
    new_course = Course(
        title=course.title,
        description=course.description,
        duration_days=course.duration_days,
        thumbnail_url=course.thumbnail_url or "default_course.png",
        is_active=False
    )

    db.add(new_course)

    await db.commit()
    await db.refresh(new_course)
    await clear_admin_courses_cache()

    return new_course


# 2. Get All Courses
async def get_all_courses(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
):
    cache_key = f"admin_courses:page={page}:size={size}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    offset = (page - 1) * size
    result = await db.scalars(
        select(Course).offset(offset).limit(size)
    )
    courses = result.all()
    await cache_set(cache_key, courses)
    return courses


# 3. Get Course By ID
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


# 4. Update Course
async def update_course(
    db: AsyncSession,
    course_id: int,
    course_data: CourseUpdate
):
    course = await db.scalar(
        select(Course).where(
            Course.id == course_id
        )
    )

    if not course:
        raise ValueError("Course not found")

    course.title = course_data.title
    course.description = course_data.description
    course.duration_days = course_data.duration_days
    course.thumbnail_url = course_data.thumbnail_url

    await db.commit()
    await db.refresh(course)
    await clear_admin_courses_cache()
    await clear_course_cache(course_id)

    return course


# 5. Delete Course

async def delete_course(
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

    # Check whether the course is assigned to any batch
    result = await db.execute(
        select(Batch.id).where(
            Batch.course_id == course_id
        )
    )

    batch_exists = result.first()

    if batch_exists:
        raise HTTPException(
            status_code=409,
            detail="Course cannot be deleted because it is assigned to one or more batches."
        )

    await db.delete(course)
    await db.commit()
    await clear_admin_courses_cache()
    await clear_course_cache(course_id)

    return {
        "message": "Course deleted successfully"
    }


# 6. Publish / Unpublish Course
async def update_course_status(
    db: AsyncSession,
    course_id: int,
    is_active: bool
):
    course = await db.scalar(
        select(Course).where(
            Course.id == course_id
        )
    )

    if not course:
        raise ValueError("Course not found")

    course.is_active = is_active

    await db.commit()
    await db.refresh(course)
    await clear_admin_courses_cache()
    await clear_course_cache(course_id)

    return course


# 7. View Enrolled Students
async def get_enrolled_students(
    db: AsyncSession,
    course_id: int
):
    result = await db.scalars(
        select(User)
        .join(
            Enrollment,
            Enrollment.user_id == User.id
        )
        .where(
            Enrollment.course_id == course_id
        )
    )

    return result.all()


# 8. View Course Completion Status
async def get_course_completion_status(
    db: AsyncSession,
    course_id: int
):
    # Get all enrolled users
    users = (
        await db.scalars(
            select(User)
            .join(
                Enrollment,
                Enrollment.user_id == User.id
            )
            .where(
                Enrollment.course_id == course_id
            )
        )
    ).all()

    # Get total learning units in the course
    total_units = len(
        (
            await db.scalars(
                select(LearningUnit)
                .join(
                    CourseDay,
                    LearningUnit.day_id == CourseDay.id
                )
                .where(
                    CourseDay.course_id == course_id
                )
            )
        ).all()
    )

    response = []

    for user in users:

        # Get completed units for this user
        completed_units = len(
            (
                await db.scalars(
                    select(Progress)
                    .join(
                        LearningUnit,
                        Progress.learning_unit_id == LearningUnit.id
                    )
                    .join(
                        CourseDay,
                        LearningUnit.day_id == CourseDay.id
                    )
                    .where(
                        Progress.user_id == user.id,
                        Progress.is_completed.is_(True),
                        CourseDay.course_id == course_id
                    )
                )
            ).all()
        )

        # Calculate completion percentage
        percentage = 0.0

        if total_units > 0:
            percentage = round(
                (completed_units / total_units) * 100,
                2
            )

        response.append(
            {
                "user_id": user.id,
                "employee_id": user.employee_id,
                "name": user.name,
                "completed_units": completed_units,
                "total_units": total_units,
                "completion_percentage": percentage
            }
        )

    return response