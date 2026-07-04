from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import Progress
from app.models.learning_unit import LearningUnit
from app.models.course_day import CourseDay
from app.models.video import Video


async def get_course_progress(
    db: AsyncSession,
    course_id: int,
    user_id: int
):
    total_units = await db.scalar(
        select(
            func.count(LearningUnit.id)
        )
        .join(
            CourseDay,
            LearningUnit.day_id == CourseDay.id
        )
        .where(
            CourseDay.course_id == course_id
        )
    )

    completed_learning_units_result = await db.execute(
        select(Progress.learning_unit_id)
        .join(
            LearningUnit,
            Progress.learning_unit_id == LearningUnit.id
        )
        .join(
            CourseDay,
            LearningUnit.day_id == CourseDay.id
        )
        .where(
            CourseDay.course_id == course_id,
            Progress.user_id == user_id,
            Progress.is_completed.is_(True)
        )
        .distinct()
        .order_by(Progress.learning_unit_id)
    )

    completed_learning_units = completed_learning_units_result.scalars().all()
    completed_units = len(completed_learning_units)

    percentage = 0

    if total_units and total_units > 0:
        percentage = round(
            (completed_units / total_units) * 100,
            2
        )

    return {
        "course_id": course_id,
        "user_id": user_id,
        "total_units": total_units,
        "completed_units": completed_units,
        "completed_learning_units": completed_learning_units,
        "completed_videos": [],
        "progress_percentage": percentage
    }


async def mark_learning_unit_completed(
    db: AsyncSession,
    user_id: int,
    learning_unit_id: int
):
    progress = await db.scalar(
        select(Progress).where(
            Progress.user_id == user_id,
            Progress.learning_unit_id == learning_unit_id
        )
    )

    if progress:

        progress.is_completed = True
        progress.completed_at = datetime.utcnow()

    else:

        progress = Progress(
            user_id=user_id,
            learning_unit_id=learning_unit_id,
            is_completed=True,
            completed_at=datetime.utcnow()
        )

        db.add(progress)

    await db.commit()

    return {
        "message": "Learning unit marked as completed"
    }


async def mark_learning_unit_incomplete(
    db: AsyncSession,
    user_id: int,
    learning_unit_id: int
):
    progress = await db.scalar(
        select(Progress).where(
            Progress.user_id == user_id,
            Progress.learning_unit_id == learning_unit_id
        )
    )

    if not progress:
        return {
            "message": "No progress record found"
        }

    progress.is_completed = False
    progress.completed_at = None

    await db.commit()

    return {
        "message": "Learning unit marked as incomplete"
    }


async def mark_video_completed(
    db: AsyncSession,
    user_id: int,
    video_id: int
):
    video = await db.scalar(
        select(Video).where(Video.id == video_id)
    )

    if not video:
        return {
            "message": "Video not found"
        }

    return {
        "message": "Video marked as completed",
        "user_id": user_id,
        "video_id": video_id
    }


from sqlalchemy import func

async def get_learning_timeline_data(
    db: AsyncSession,
    user_id: int
):

    result = await db.execute(
        select(
            CourseDay.day_number,
            func.count(
                Progress.id
            ).label(
                "completed_units"
            ),
            func.coalesce(
                func.sum(
                    LearningUnit.duration_minutes
                ),
                0
            ).label(
                "learning_minutes"
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
            Progress.user_id
            ==
            user_id,
            Progress.is_completed.is_(True)
        )
        .group_by(
            CourseDay.day_number
        )
        .order_by(
            CourseDay.day_number
        )
    )

    rows = result.all()

    return [
        {
            "day_number": row.day_number,
            "completed_units": row.completed_units,
            "learning_minutes": row.learning_minutes
        }
        for row in rows
    ]
