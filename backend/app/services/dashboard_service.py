from datetime import datetime
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.progress import Progress
from app.models.enrollment import Enrollment


async def get_dashboard(
    db: AsyncSession,
    user_id: int
):

    user = await db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError(
            "User not found"
        )

    courses_enrolled = await db.scalar(
        select(
            func.count(
                Enrollment.id
            )
        ).where(
            Enrollment.user_id == user_id
        )
    )

    courses_enrolled = courses_enrolled or 0

    enrollment = await db.scalar(
        select(Enrollment)
        .where(
            Enrollment.user_id == user_id
        )
        .order_by(
            Enrollment.enrolled_at.desc()
        )
    )

    course = None

    current_day = None
    duration_days = None

    start_date = None
    end_date = None

    total_units = 0

    if enrollment:

        course = await db.scalar(
            select(Course)
            .where(
                Course.id == enrollment.course_id
            )
        )

        if course:

            duration_days = course.duration_days

            start_date = (
                enrollment.enrolled_at.date()
            )

            end_date = (
                start_date
                +
                timedelta(days=duration_days - 1)
            )

            current_day = max(
                1,
                min(
                    (
                        datetime.utcnow().date()
                        -
                        start_date
                    ).days + 1,
                    duration_days
                )
            )

            total_units = await db.scalar(
                select(
                    func.count(
                        LearningUnit.id
                    )
                )
                .join(
                    CourseDay,
                    LearningUnit.day_id
                    ==
                    CourseDay.id
                )
                .where(
                    CourseDay.course_id
                    ==
                    course.id
                )
            )

    total_units = total_units or 0

    completed_units = await db.scalar(
        select(
            func.count(
                Progress.id
            )
        )
        .join(
            LearningUnit,
            Progress.learning_unit_id
            ==
            LearningUnit.id
        )
        .join(
            CourseDay,
            LearningUnit.day_id
            ==
            CourseDay.id
        )
        .where(
            Progress.user_id == user_id,
            Progress.is_completed.is_(True),
            CourseDay.course_id == course.id
        )
    ) if course else 0

    completed_units = completed_units or 0

    remaining_units = (
        total_units
        -
        completed_units
    )

    if remaining_units < 0:
        remaining_units = 0

    progress_percentage = 0.0

    if total_units > 0:

        progress_percentage = round(
            (
                completed_units
                /
                total_units
            ) * 100,
            2
        )

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
            Progress.learning_unit_id
            ==
            LearningUnit.id
        )
        .join(
            CourseDay,
            LearningUnit.day_id
            ==
            CourseDay.id
        )
        .where(
            Progress.user_id == user_id,
            Progress.is_completed.is_(True),
            CourseDay.course_id == course.id
        )
    ) if course else 0

    estimated_learning_minutes = (
        estimated_learning_minutes or 0
    )

    return {

        "employee_id":
            user.employee_id,

        "email":
            user.email,

        "courses_enrolled":
            courses_enrolled,

        "current_course": (

            {
                "course_id":
                    course.id,

                "course_name":
                    course.title,

                "current_day":
                    current_day,

                "duration_days":
                    duration_days,

                "start_date":
                    start_date,

                "end_date":
                    end_date,

                "total_units":
                    total_units,

                "completed_units":
                    completed_units,

                "remaining_units":
                    remaining_units,

                "progress_percentage":
                    progress_percentage,

                "content_minutes_completed":
                    estimated_learning_minutes,

                "assessment_time_hours":
                10,
                
                "assignment_time_hours":
                5,
            }

            if course
            else None
        )
    }