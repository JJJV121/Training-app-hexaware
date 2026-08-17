from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import Progress
from app.models.learning_unit import LearningUnit
from app.models.course_day import CourseDay
from app.models.video import Video
from app.models.video_progress import VideoProgress


async def get_course_progress(
    db: AsyncSession,
    course_id: int,
    user_id: int
):
    # Get all learning units for this course
    result = await db.execute(
        select(
            LearningUnit.id,
            CourseDay.day_number,
            Progress.learning_unit_id.label("progress_unit_id")
        )
        .join(
            CourseDay,
            LearningUnit.day_id == CourseDay.id
        )
        .outerjoin(
            Progress,
            (Progress.learning_unit_id == LearningUnit.id)
            & (Progress.user_id == user_id)
            & (Progress.is_completed.is_(True))
        )
        .where(
            CourseDay.course_id == course_id
        )
        .order_by(
            CourseDay.day_number,
            LearningUnit.display_order
        )
    )

    rows = result.all()

    # Overall progress
    total_units = len(rows)

    completed_learning_units = sorted(
        list({
            row.id
            for row in rows
            if row.progress_unit_id is not None
        })
    )

    completed_units = len(completed_learning_units)

    progress_percentage = 0.0

    if total_units > 0:
        progress_percentage = round(
            (completed_units / total_units) * 100,
            2
        )

    # Day-wise progress
    day_data = {}

    for row in rows:
        day_number = row.day_number

        if day_number not in day_data:
            day_data[day_number] = {
                "day_number": day_number,
                "total_units": 0,
                "completed_units": 0
            }

        day_data[day_number]["total_units"] += 1

        if row.progress_unit_id is not None:
            day_data[day_number]["completed_units"] += 1

    day_progress = []

    for day_number in sorted(day_data):
        day = day_data[day_number]

        day_percentage = 0.0

        if day["total_units"] > 0:
            day_percentage = round(
                (
                    day["completed_units"]
                    / day["total_units"]
                ) * 100,
                2
            )

        day_progress.append({
            "day_number": day["day_number"],
            "total_units": day["total_units"],
            "completed_units": day["completed_units"],
            "progress_percentage": day_percentage
        })

            # Get completed videos for this course and user
    video_result = await db.execute(
        select(VideoProgress.video_id)
        .join(
            Video,
            Video.id == VideoProgress.video_id
        )
        .join(
            LearningUnit,
            LearningUnit.id == Video.learning_unit_id
        )
        .join(
            CourseDay,
            CourseDay.id == LearningUnit.day_id
        )
        .where(
            CourseDay.course_id == course_id,
            VideoProgress.user_id == user_id,
            VideoProgress.is_completed.is_(True)
        )
    )

    completed_videos = sorted(
        list(set(video_result.scalars().all()))
    )

    return {
        "course_id": course_id,
        "user_id": user_id,
        "total_units": total_units,
        "completed_units": completed_units,
        "progress_percentage": progress_percentage,
        "completed_learning_units": completed_learning_units,
        "completed_videos": completed_videos,
        "day_progress": day_progress
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
    # Check whether the video exists
    video = await db.scalar(
        select(Video).where(
            Video.id == video_id
        )
    )

    if not video:
        return {
            "message": "Video not found"
        }

    # Check whether this user already has progress for this video
    video_progress = await db.scalar(
        select(VideoProgress).where(
            VideoProgress.user_id == user_id,
            VideoProgress.video_id == video_id
        )
    )

    if video_progress:
        video_progress.is_completed = True
        video_progress.completed_at = datetime.utcnow()

    else:
        video_progress = VideoProgress(
            user_id=user_id,
            video_id=video_id,
            is_completed=True,
            completed_at=datetime.utcnow()
        )

        db.add(video_progress)

    await db.commit()

    return {
        "message": "Video marked as completed",
        "user_id": user_id,
        "video_id": video_id
    }


async def get_learning_timeline_data(
    db: AsyncSession,
    user_id: int,
    course_id: int | None = None
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
            Progress.user_id == user_id,
            Progress.is_completed.is_(True),
            *(
                [CourseDay.course_id == course_id]
                if course_id is not None
                else []
            )
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
