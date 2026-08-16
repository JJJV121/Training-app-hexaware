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
from app.utils.cache_utils import cache_get, cache_set
from datetime import timedelta
from app.models.user import User


async def get_all_courses(
    db: AsyncSession,
    page: int = 1,
    size: int = 20
):
    cache_key = f"courses:page={page}:size={size}"
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


async def get_content_by_learning_unit(db:AsyncSession, learning_unit_id):
    result = await db.execute(
        select(Content).where(
            Content.learning_unit_id == learning_unit_id
        )
    )

    content = result.scalar_one_or_none()

    if content is None:
        return None

    return {
        "id": content.id,
        "learning_unit_id": content.learning_unit_id,
        "content_text": content.content_text
    }


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
    stmt = (
        select(Course, CourseDay, LearningUnit)
        .outerjoin(CourseDay, CourseDay.course_id == Course.id)
        .outerjoin(LearningUnit, LearningUnit.day_id == CourseDay.id)
        .where(Course.id == course_id)
        .order_by(CourseDay.day_number, LearningUnit.display_order)
    )
    res = await db.execute(stmt)
    rows = res.all()

    if not rows:
        raise ValueError("Course not found")

    course = rows[0][0]

    days_dict = {}
    day_order = []

    for r_course, r_day, r_unit in rows:
        if r_day is None:
            continue
        if r_day.id not in days_dict:
            days_dict[r_day.id] = {
                "day_id": r_day.id,
                "day_number": r_day.day_number,
                "title": r_day.title,
                "units": []
            }
            day_order.append(r_day.id)
        if r_unit is not None:
            days_dict[r_day.id]["units"].append(r_unit)

    course_data = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "duration_days": course.duration_days,
        "thumbnail_url": course.thumbnail_url
    }

    result = []
    for day_id in day_order:
        day_dict = days_dict[day_id]
        units_list = []
        for unit in day_dict["units"]:
            units_list.append({
                "id": unit.id,
                "title": unit.title,
                "duration_mins": unit.duration_minutes,
                "display_order": unit.display_order
            })
        result.append({
            "day_id": day_dict["day_id"],
            "day_number": day_dict["day_number"],
            "title": day_dict["title"],
            "learning_units": units_list
        })

    return {
        "course": course_data,
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

from sqlalchemy import select

async def get_course_summaries(db: AsyncSession, page: int = 1, size: int = 20):
    offset = (page - 1) * size
    stmt = select(Course.id, Course.title, Course.description, Course.thumbnail_url).offset(offset).limit(size)
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "thumbnail_url": getattr(row, "thumbnail_url", None)
        }
        for row in rows
    ]
async def get_enrollment(
    db: AsyncSession,
    user_id: int,
    course_id: int
):
    enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        )
    )

    if not enrollment:
        raise ValueError(
            "User is not enrolled in this course"
        )

    return enrollment
async def get_course_status(
    db: AsyncSession,
    user_id: int,
    course_id: int
):
    result = await db.execute(
        select(Enrollment, Course)
        .join(
            Course,
            Course.id == Enrollment.course_id
        )
        .where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        )
    )

    row = result.first()

    if not row:
        raise ValueError(
            "User is not enrolled in this course"
        )

    enrollment, course = row

    start_date = enrollment.enrolled_at.date()

    end_date = start_date + timedelta(
        days=course.duration_days - 1
    )

    return {
        "course_id": course.id,
        "course_name": course.title,
        "status": "active" if course.is_active else "inactive",
        "start_date": start_date,
        "end_date": end_date
    }
async def get_enrolled_courses(
    db: AsyncSession,
    user_id: int
):
    result = await db.execute(
        select(Enrollment, Course)
        .join(
            Course,
            Course.id == Enrollment.course_id
        )
        .where(
            Enrollment.user_id == user_id
        )
        .order_by(
            Enrollment.enrolled_at.desc()
        )
    )

    rows = result.all()

    enrolled_courses = []

    for enrollment, course in rows:

        start_date = enrollment.enrolled_at.date()

        end_date = start_date + timedelta(
            days=course.duration_days - 1
        )

        enrolled_courses.append({
            "course_id": course.id,
            "course_name": course.title,
            "description": course.description,
            "start_date": start_date,
            "end_date": end_date,
            "status": "active" if course.is_active else "inactive"
        })

    return enrolled_courses
async def get_trainee(
    db: AsyncSession,
    user_id: int
):
    user = await db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError("User not found")

    return {
        "id": user.id,
        "name": user.name,
        "employee_id": user.employee_id,
        "email": user.email,
        "is_active": user.is_active,
        "role": user.role
    }
async def get_enrollment(
    db: AsyncSession,
    user_id: int,
    course_id: int
):
    enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        )
    )

    if not enrollment:
        raise ValueError(
            "User is not enrolled in this course"
        )

    return enrollment
