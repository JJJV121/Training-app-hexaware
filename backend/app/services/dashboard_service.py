from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress
from app.models.enrollment import Enrollment


def calculate_unlocked_day(course_days, day_progress_map):
    if not course_days:
        return 1

    unlocked_day = 1

    for day in sorted(course_days, key=lambda item: item.day_number):
        if day.day_number == 1:
            continue

        previous_day = next(
            (
                item for item in course_days
                if item.day_number == day.day_number - 1
            ),
            None,
        )

        if previous_day is None:
            break

        previous_progress = day_progress_map.get(previous_day.id, {})
        previous_total_modules = previous_progress.get("total_modules", 0)
        previous_completed_modules = previous_progress.get("completed_modules", 0)
        previous_completed_at = previous_progress.get("completed_at_max")

        if previous_total_modules == 0:
            unlocked_day = day.day_number
            continue

        if previous_completed_modules >= previous_total_modules:
            if previous_completed_at:
                completion_date = previous_completed_at.date()
                current_date = datetime.utcnow().date()
                if current_date > completion_date:
                    unlocked_day = day.day_number
                else:
                    break
            else:
                unlocked_day = day.day_number
        else:
            break

    return unlocked_day


async def get_dashboard(
    db: AsyncSession,
    user_id: int
):
    count_subquery = (
        select(func.count(Enrollment.id))
        .where(Enrollment.user_id == user_id)
        .scalar_subquery()
    )

    stmt = (
        select(User, Enrollment, Course, count_subquery)
        .outerjoin(Enrollment, Enrollment.user_id == User.id)
        .outerjoin(Course, Course.id == Enrollment.course_id)
        .where(User.id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(1)
    )

    res = await db.execute(stmt)
    row = res.first()

    if not row:
        raise ValueError(
            "User not found"
        )

    user, enrollment, course, courses_enrolled = row
    courses_enrolled = courses_enrolled or 0

    if not enrollment or not course:
        return {
            "name": user.name or user.employee_id,
            "employee_id": user.employee_id,
            "email": user.email,
            "courses_enrolled": courses_enrolled,
            "current_course": None
        }

    duration_days = course.duration_days
    start_date = enrollment.enrolled_at.date()
    end_date = (
        start_date +
        timedelta(days=duration_days - 1)
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

    day_ids = [day.id for day in course_days]

    total_map = {}
    completed_map = {}
    if day_ids:
        day_progress_stmt = (
            select(
                LearningUnit.day_id,
                func.count(LearningUnit.id),
                func.count(Progress.id),
                func.max(Progress.completed_at)
            )
            .outerjoin(
                Progress,
                (Progress.learning_unit_id == LearningUnit.id)
                & (Progress.user_id == user_id)
                & (Progress.is_completed.is_(True))
            )
            .where(LearningUnit.day_id.in_(day_ids))
            .group_by(LearningUnit.day_id)
        )
        day_progress_res = await db.execute(day_progress_stmt)

        for row_dp in day_progress_res.all():
            d_id, tot, comp, comp_at = row_dp
            total_map[d_id] = tot
            completed_map[d_id] = (comp, comp_at)

    day_progress_map = {}
    for day in course_days:
        day_total_modules = total_map.get(day.id, 0)
        day_completed_modules, completed_at_max_raw = completed_map.get(day.id, (0, None))

        completed_at_max = None
        if day_completed_modules >= day_total_modules and day_total_modules > 0:
            completed_at_max = completed_at_max_raw

        day_progress_map[day.id] = {
            "total_modules": day_total_modules,
            "completed_modules": day_completed_modules,
            "completed_at_max": completed_at_max,
        }

    current_day = calculate_unlocked_day(course_days, day_progress_map)

    total_modules = sum(total_map.values())
    completed_modules = sum(val[0] for val in completed_map.values())
    remaining_modules = max(0, total_modules - completed_modules)

    progress_percentage = 0.0
    if total_modules > 0:
        progress_percentage = round(
            (
                completed_modules
                / total_modules
            ) * 100,
            2
        )

    current_day_record = next(
        (day for day in course_days if day.day_number == current_day),
        None
    )

    day_progress_percentage = 0.0
    if current_day_record:
        current_day_progress = day_progress_map.get(current_day_record.id, {})
        current_day_total_modules = current_day_progress.get("total_modules", 0)
        current_day_completed_modules = current_day_progress.get("completed_modules", 0)

        if current_day_total_modules > 0:
            day_progress_percentage = round(
                (
                    current_day_completed_modules
                    / current_day_total_modules
                ) * 100,
                2
            )

    day_wise_progress = []
    for day in course_days:
        if day.day_number > current_day:
            continue
        day_progress = day_progress_map.get(day.id, {})
        day_total_modules = day_progress.get("total_modules", 0)
        day_completed_modules = day_progress.get("completed_modules", 0)

        percentage = 0.0
        if day_total_modules > 0:
            percentage = round(
                (
                    day_completed_modules
                    / day_total_modules
                ) * 100,
                2
            )

        day_wise_progress.append(
            {
                "day": day.day_number,
                "progress_percentage": percentage
            }
        )

    estimated_learning_minutes = 0
    if day_ids:
        estimated_learning_minutes = await db.scalar(
            select(
                func.coalesce(
                    func.sum(
                        LearningUnit.duration_minutes
                    ),
                    0
                )
            )
            .join(
                Progress,
                Progress.learning_unit_id == LearningUnit.id
            )
            .where(
                Progress.user_id == user_id,
                Progress.is_completed.is_(True),
                LearningUnit.day_id.in_(day_ids)
            )
        )
        estimated_learning_minutes = estimated_learning_minutes or 0

    learning_hours_completed = round(estimated_learning_minutes / 60, 2)
    return {
        "name": user.name or user.employee_id,
        "employee_id": user.employee_id,
        "email": user.email,
        "courses_enrolled": courses_enrolled,
        "current_course": {
            "course_id": course.id,
            "course_name": course.title,
            "current_day": current_day,
            "duration_days": duration_days,
            "start_date": start_date,
            "end_date": end_date,
            "total_modules": total_modules,
            "completed_modules": completed_modules,
            "remaining_modules": remaining_modules,
            "progress_percentage": progress_percentage,
            "day_progress_percentage": day_progress_percentage,
            "day_wise_progress": day_wise_progress,
            "learning_hours_completed": learning_hours_completed,
            "assessment_time_hours": 10,
            "assignment_time_hours": 5
        }
    }