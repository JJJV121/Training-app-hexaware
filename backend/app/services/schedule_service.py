from datetime import timedelta
from collections import defaultdict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.enrollment import Enrollment
from app.models.progress import Progress


TIME_SLOTS = [
    ("09:00", "10:30"),
    ("10:45", "12:15"),
    ("12:30", "14:00"),
    ("14:15", "15:45"),
    ("16:00", "17:30"),
    ("17:45", "19:15"),
    ("19:30", "21:00")
]


async def get_user_schedule(
    db: AsyncSession,
    user_id: int
):

    enrollment = await db.scalar(
        select(Enrollment)
        .where(
            Enrollment.user_id == user_id
        )
        .order_by(
            Enrollment.enrolled_at.desc()
        )
    )

    if not enrollment:
        raise ValueError(
            "User is not enrolled in any course"
        )

    course = await db.scalar(
        select(Course).where(
            Course.id == enrollment.course_id
        )
    )

    if not course:
        raise ValueError(
            "Course not found"
        )

    course_days = (
        await db.scalars(
            select(CourseDay)
            .where(
                CourseDay.course_id == course.id
            )
            .order_by(
                CourseDay.day_number
            )
        )
    ).all()

    total_modules = 0

    schedule = []

    current_day = 1

    for day in course_days:

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

        total_modules += len(units)

        actual_date = (
            enrollment.enrolled_at.date()
            +
            timedelta(days=day.day_number - 1)
        )

        sessions = []

        completed_count = 0

        for index, unit in enumerate(units):

            progress = await db.scalar(
                select(Progress)
                .where(
                    Progress.user_id == user_id,
                    Progress.learning_unit_id == unit.id,
                    Progress.is_completed.is_(True)
                )
            )

            if progress:
                completed_count += 1

            slot_index = min(
                index,
                len(TIME_SLOTS) - 1
            )

            start_time, end_time = (
                TIME_SLOTS[slot_index]
            )

            sessions.append(
                {
                    "learning_unit_id": unit.id,
                    "title": unit.title,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration_minutes":
                        unit.duration_minutes
                        or 0,
                    "completed":
                        progress is not None
                }
            )

        status = "upcoming"

        if len(units) > 0:

            if completed_count == len(units):
                status = "completed"

            elif completed_count > 0:
                status = "current"

        schedule.append(
            {
                "day_number":
                    day.day_number,

                "date":
                    actual_date,

                "weekday":
                    actual_date.strftime("%A"),

                "title":
                    day.title,

                "status":
                    status,

                "sessions":
                    sessions
            }
        )

    total_hours = round(
        (
            await db.scalar(
                select(
                    func.coalesce(
                        func.sum(
                            LearningUnit.duration_minutes
                        ),
                        0
                    )
                )
                .join(
                    CourseDay,
                    LearningUnit.day_id
                    == CourseDay.id
                )
                .where(
                    CourseDay.course_id
                    == course.id
                )
            )
            or 0
        ) / 60,
        1
    )

    return {

        "course_id":
            course.id,

        "course_name":
            course.title,

        "start_date":
            enrollment.enrolled_at.date(),

        "end_date":
            (
                enrollment.enrolled_at.date()
                +
                timedelta(
                    days=
                    course.duration_days - 1
                )
            ),

        "current_day":
            current_day,

        "summary": {

            "total_modules":
                total_modules,

            "total_sections":
                total_modules,

            "total_days":
                len(course_days),

            "total_hours":
                total_hours
        },

        "schedule":
            schedule
    }