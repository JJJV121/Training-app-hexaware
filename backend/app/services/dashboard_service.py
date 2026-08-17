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
    # Fetch user details
    user_stmt = select(User).where(User.id == user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    # Fetch all enrollments for this user, ordered by enrolled_at desc
    enrollments_stmt = (
        select(Enrollment, Course)
        .join(Course, Course.id == Enrollment.course_id)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments_res = await db.execute(enrollments_stmt)
    user_enrollments = enrollments_res.all()
    courses_enrolled = len(user_enrollments)

    if courses_enrolled == 0:
        return {
            "name": user.name or user.employee_id,
            "employee_id": user.employee_id,
            "email": user.email,
            "courses_enrolled": 0,
            "course": None,
            "progress": None,
            "time_spent": None,
            "continue_learning": None,
            "enrolled_courses": []
        }

    # Primary active course is the first one (most recently enrolled)
    active_enrollment, active_course = user_enrollments[0]

    course_ids = [c.id for _, c in user_enrollments]
    all_cdays_res = await db.scalars(
        select(CourseDay)
        .where(CourseDay.course_id.in_(course_ids))
        .order_by(CourseDay.day_number)
    )
    all_cdays = all_cdays_res.all()

    # Map course_id -> list of CourseDay
    course_days_map = {}
    for day in all_cdays:
        course_days_map.setdefault(day.course_id, []).append(day)

    # Get active course days
    course_days = course_days_map.get(active_course.id, [])
    day_ids = [day.id for day in course_days]

    all_day_ids = [day.id for day in all_cdays]
    day_stats_map = {} # day_id -> (total_units, completed_units, completed_at_max)

    if all_day_ids:
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
            .where(LearningUnit.day_id.in_(all_day_ids))
            .group_by(LearningUnit.day_id)
        )
        day_progress_res = await db.execute(day_progress_stmt)

        for row_dp in day_progress_res.all():
            d_id, tot, comp, comp_at = row_dp
            day_stats_map[d_id] = (tot, comp, comp_at)

    day_progress_map = {}
    completed_days = 0
    total_modules = 0
    completed_modules = 0

    for day in course_days:
        day_total_modules, day_completed_modules, completed_at_max_raw = day_stats_map.get(day.id, (0, 0, None))
        total_modules += day_total_modules
        completed_modules += day_completed_modules

        completed_at_max = None
        if day_completed_modules >= day_total_modules and day_total_modules > 0:
            completed_at_max = completed_at_max_raw
            completed_days += 1

        day_progress_map[day.id] = {
            "total_modules": day_total_modules,
            "completed_modules": day_completed_modules,
            "completed_at_max": completed_at_max,
        }

    current_day = calculate_unlocked_day(course_days, day_progress_map)
    remaining_modules = max(0, total_modules - completed_modules)

    # Calculate completed percentage based on completed_days vs total_days
    completed_percentage = 0.0
    total_days = len(course_days)
    if total_days > 0:
        completed_percentage = round((completed_days / total_days) * 100, 2)
    elif total_modules > 0:
        completed_percentage = round((completed_modules / total_modules) * 100, 2)

    duration_days = active_course.duration_days
    start_date = active_enrollment.enrolled_at.date()
    end_date = start_date + timedelta(days=duration_days - 1)

    # Motivation message based on progress percentage
    if completed_percentage <= 25:
        motivation_message = "Let's get started!"
    elif completed_percentage <= 60:
        motivation_message = "Great Progress!"
    elif completed_percentage <= 90:
        motivation_message = "Almost There!"
    else:
        motivation_message = "Congratulations!"

    course_response_data = {
        "id": active_course.id,
        "name": active_course.title,
        "current_day": current_day,
        "total_days": total_days if total_days > 0 else duration_days,
        "total_modules": total_modules,
        "completed_modules": completed_modules,
        "remaining_modules": remaining_modules,
        "completed_percentage": completed_percentage,
        "start_date": start_date,
        "end_date": end_date,
        "motivation_message": motivation_message
    }

    # Progress response data
    progress_response_data = {
        "completed_days": completed_days,
        "remaining_days": max(0, (total_days if total_days > 0 else duration_days) - completed_days)
    }

    # Time spent response data
    learning_mins = 0
    assessment_mins = 0
    practice_mins = 0
    revision_mins = 0

    if day_ids:
        # Fetch titles and durations of completed learning units
        stmt = (
            select(LearningUnit.title, LearningUnit.duration_minutes)
            .join(Progress, Progress.learning_unit_id == LearningUnit.id)
            .where(
                Progress.user_id == user_id,
                Progress.is_completed.is_(True),
                LearningUnit.day_id.in_(day_ids)
            )
        )
        res_units = await db.execute(stmt)
        for title, duration_minutes in res_units.all():
            dur = duration_minutes or 0
            title_lower = title.lower() if title else ""
            
            if any(word in title_lower for word in ["assessment", "challenge", "quiz", "exam", "test"]):
                assessment_mins += dur
            elif any(word in title_lower for word in ["assignment", "q&a", "practice", "lab", "case study", "development", "project"]):
                practice_mins += dur
            elif any(word in title_lower for word in ["review", "recap", "revision", "summary"]):
                revision_mins += dur
            else:
                learning_mins += dur

    learning_hours = round(learning_mins / 60, 2)
    assessment_hours = round(assessment_mins / 60, 2)
    practice_hours = round(practice_mins / 60, 2)
    revision_hours = round(revision_mins / 60, 2)

    time_spent_response_data = {
        "learning_hours": learning_hours,
        "assessment_hours": assessment_hours,
        "practice_hours": practice_hours,
        "revision_hours": revision_hours
    }

    # Continue learning response data
    # Find first incomplete learning unit in the course
    first_incomplete_stmt = (
        select(LearningUnit, CourseDay)
        .join(CourseDay, CourseDay.id == LearningUnit.day_id)
        .outerjoin(
            Progress,
            (Progress.learning_unit_id == LearningUnit.id)
            & (Progress.user_id == user_id)
            & (Progress.is_completed.is_(True))
        )
        .where(CourseDay.course_id == active_course.id, Progress.id.is_(None))
        .order_by(CourseDay.day_number, LearningUnit.display_order)
        .limit(1)
    )
    incomplete_res = await db.execute(first_incomplete_stmt)
    incomplete_row = incomplete_res.first()
    if incomplete_row:
        incomplete_unit, incomplete_day = incomplete_row
        continue_learning_response_data = {
            "course_id": active_course.id,
            "day": incomplete_day.day_number,
            "module_id": incomplete_unit.id
        }
    else:
        # If all completed, point to the last unit in the course
        last_unit_stmt = (
            select(LearningUnit, CourseDay)
            .join(CourseDay, CourseDay.id == LearningUnit.day_id)
            .where(CourseDay.course_id == active_course.id)
            .order_by(CourseDay.day_number.desc(), LearningUnit.display_order.desc())
            .limit(1)
        )
        last_res = await db.execute(last_unit_stmt)
        last_row = last_res.first()
        if last_row:
            last_unit, last_day = last_row
            continue_learning_response_data = {
                "course_id": active_course.id,
                "day": last_day.day_number,
                "module_id": last_unit.id
            }
        else:
            continue_learning_response_data = {
                "course_id": active_course.id,
                "day": 1,
                "module_id": None
            }

    # Calculate other enrolled courses
    enrolled_courses_data = []
    for enrollment_item, course_item in user_enrollments:
        cdays = course_days_map.get(course_item.id, [])
        
        ctotal_modules = 0
        ccompleted_modules = 0
        ccompleted_days = 0
        
        for d in cdays:
            tot, comp, _ = day_stats_map.get(d.id, (0, 0, None))
            ctotal_modules += tot
            ccompleted_modules += comp
            if tot > 0 and comp >= tot:
                ccompleted_days += 1
        
        c_pct = 0.0
        if cdays:
            c_pct = round((ccompleted_days / len(cdays)) * 100, 2)
        elif ctotal_modules > 0:
            c_pct = round((ccompleted_modules / ctotal_modules) * 100, 2)
            
        c_start_date = enrollment_item.enrolled_at.date()
        c_end_date = c_start_date + timedelta(days=course_item.duration_days - 1)
        
        enrolled_courses_data.append({
            "course_id": course_item.id,
            "course_name": course_item.title,
            "progress": c_pct,
            "start_date": c_start_date,
            "end_date": c_end_date,
            "completion_percentage": c_pct
        })

    return {
        "name": user.name or user.employee_id,
        "employee_id": user.employee_id,
        "email": user.email,
        "courses_enrolled": courses_enrolled,
        "course": course_response_data,
        "progress": progress_response_data,
        "time_spent": time_spent_response_data,
        "continue_learning": continue_learning_response_data,
        "enrolled_courses": enrolled_courses_data
    }