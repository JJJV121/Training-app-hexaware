from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.services.progress_service import (
    get_course_progress,
    mark_learning_unit_completed,
    mark_learning_unit_incomplete,
    mark_video_completed,
    get_learning_timeline_data
)

router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)

@router.get(
    "/course/{course_id}/user/{user_id}"
)
async def progress(
    course_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_course_progress(
        db,
        course_id,
        user_id
    )

@router.post(
    "/{user_id}/{learning_unit_id}/complete"
)
async def complete_unit(
    user_id: int,
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await mark_learning_unit_completed(
        db,
        user_id,
        learning_unit_id
    )

@router.post(
    "/{user_id}/{learning_unit_id}/incomplete"
)
async def incomplete_unit(
    user_id: int,
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await mark_learning_unit_incomplete(
        db,
        user_id,
        learning_unit_id
    )


@router.post(
    "/{user_id}/video/{video_id}/complete"
)
async def complete_video(
    user_id: int,
    video_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await mark_video_completed(
        db,
        user_id,
        video_id
    )

@router.get(
    "/users/{user_id}/timeline"
)
async def timeline(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_learning_timeline_data(
        db,
        user_id
    )
