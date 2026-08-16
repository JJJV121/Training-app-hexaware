from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.course import EnrollmentRequest
from app.services.course_service import (
    get_all_courses,
    get_course_by_id,
    get_days_by_course,
    get_learning_units_by_day,
    get_content_by_learning_unit,
    get_videos_by_learning_unit,
    get_course_content,
    enroll_user_in_course,
    get_user_courses,
    get_course_summaries,
    get_enrollment,
    get_course_status,
    get_enrolled_courses,
    get_trainee,
)

from app.services.lesson_service import (
    get_qa_by_learning_unit,
    get_notes_by_learning_unit
)


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


@router.get("/")
async def get_courses(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    size: int = 20,
):
    return await get_all_courses(db, page=page, size=size)


@router.get("/{course_id}")
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await get_course_by_id(
            db,
            course_id
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
@router.get("/users/{user_id}/enrollments")
async def get_enrolled_courses_for_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_enrolled_courses(
            db,
            user_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

@router.get("/{course_id}/content")
async def get_course_full_content(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        from app.utils.cache_utils import cache_get, cache_set
        
        # Try returning cached course content directly
        cache_key = f"course_content:{course_id}"
        cached_content = await cache_get(cache_key)
        if cached_content is not None:
            return cached_content

        # Retrieve and cache course content
        content = await get_course_content(db, course_id)
        await cache_set(cache_key, content, expire=3600)
        return content

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

@router.get("/{course_id}/days")
async def get_days(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_days_by_course(
        db,
        course_id
    )


@router.get("/{course_id}/days/{day_id}/units")
async def get_units(
    day_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_learning_units_by_day(
        db,
        day_id
    )

@router.get("/units/{learning_unit_id}/content")
async def get_content(
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_content_by_learning_unit(
        db,
        learning_unit_id
    )


@router.get("/units/{learning_unit_id}/videos")
async def get_videos(
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_videos_by_learning_unit(
        db,
        learning_unit_id
    )


@router.get("/units/{learning_unit_id}/qa")
async def get_qa(
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_qa_by_learning_unit(
        db,
        learning_unit_id
    )
@router.get("/units/{learning_unit_id}/notes")
async def get_notes(
    learning_unit_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_notes_by_learning_unit(
        db,
        learning_unit_id
    )


@router.post("/enroll")
async def enroll_course(
    enrollment: EnrollmentRequest,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await enroll_user_in_course(
            db,
            enrollment.user_id,
            enrollment.course_id
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )   

# New endpoint for paginated course summaries
@router.get("/summaries")
async def get_course_summaries(page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    return await get_course_summaries(db, page, size)

@router.get("/users/{user_id}/trainee")
async def get_trainee_details(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_trainee(
            db,
            user_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
@router.get("/users/{user_id}/courses/{course_id}/status")
async def get_user_course_status(
    user_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_course_status(
            db,
            user_id,
            course_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )