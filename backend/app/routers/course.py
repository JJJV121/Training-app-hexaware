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
    get_user_courses
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
    db: AsyncSession = Depends(get_db)
):
    return await get_all_courses(db)


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
    
@router.get("/users/{user_id}")
async def get_courses_by_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_user_courses(
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

        return await get_course_content(
            db,
            course_id
        )

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