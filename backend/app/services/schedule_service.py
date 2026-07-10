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

    enrollment_course_res = await db.execute(
        select(Enrollment, Course)
        .join(Course, Course.id == Enrollment.course_id)
        .where(
            Enrollment.user_id == user_id
        )
        .order_by(
            Enrollment.enrolled_at.desc()
        )
        .limit(1)
    )
    enrollment_course = enrollment_course_res.first()

    if not enrollment_course:
        raise ValueError(
            "User is not enrolled in any course"
        )

    enrollment, course = enrollment_course

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

    day_ids = [day.id for day in course_days]
    units_by_day = {}
    all_units = []

    if day_ids:
        all_units = (
            await db.scalars(
                select(LearningUnit)
                .where(
                    LearningUnit.day_id.in_(day_ids)
                )
                .order_by(
                    LearningUnit.display_order
                )
            )
        ).all()

        for unit in all_units:
            if unit.day_id not in units_by_day:
                units_by_day[unit.day_id] = []
            units_by_day[unit.day_id].append(unit)

    progress_by_unit = {}
    unit_ids = [unit.id for unit in all_units]
    if unit_ids:
        all_progress = (
            await db.scalars(
                select(Progress)
                .where(
                    Progress.user_id == user_id,
                    Progress.learning_unit_id.in_(unit_ids),
                    Progress.is_completed.is_(True)
                )
            )
        ).all()

        for progress in all_progress:
            progress_by_unit[progress.learning_unit_id] = progress

    total_modules = 0

    schedule = []
    day_progress_map = {}

    for day in course_days:

        units = units_by_day.get(day.id, [])

        total_modules += len(units)

        actual_date = (
            enrollment.enrolled_at.date()
            +
            timedelta(days=day.day_number - 1)
        )

        sessions = []

        completed_count = 0
        completed_dates = []

        for index, unit in enumerate(units):

            progress = progress_by_unit.get(unit.id)

            if progress:
                completed_count += 1
                if progress.completed_at:
                    completed_dates.append(progress.completed_at)

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

        day_progress_map[day.id] = {
            "total_modules": len(units),
            "completed_modules": completed_count,
            "completed_at_max": max(completed_dates) if completed_dates else None
        }

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

    from app.services.dashboard_service import calculate_unlocked_day
    current_day = calculate_unlocked_day(course_days, day_progress_map)

    total_hours = round(
        sum(unit.duration_minutes or 0 for unit in all_units) / 60,
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
