# 1. Create courses                       -- done
# 2. Edit courses                         -- done
# 3. Delete courses                       -- done
# 4. Publish/unpublish courses            -- done
# 5. Assign trainers 
# 6. Set course duration                  -- maybe reconsider if not update endpoint is enough
# 7. Upload syllabus 
# 8. Upload learning resources
# 9. View Enrolled students               -- done
# 10.View course completion status        -- done

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.course import CourseResponse

from app.schemas.admin_course import (
    CourseCreate,
    CourseUpdate,
    CourseStatusUpdate,
    EnrolledStudentResponse,
    CourseCompletionResponse
)

from app.services.admin_course_service import (
    create_course,
    get_all_courses,
    get_course_by_id,
    update_course,
    delete_course,
    update_course_status,
    get_enrolled_students,
    get_course_completion_status
)


router = APIRouter(
    prefix="/admin/courses",
    tags=["Admin Course Management"]
)


# =========================================================
# 1. CREATE COURSE
# =========================================================

@router.post(
    "/",
    response_model=CourseResponse
)
async def create_course_api(
    course: CourseCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_course(
        db,
        course
    )


# =========================================================
# 2. GET ALL COURSES
# =========================================================

@router.get(
    "/",
    response_model=list[CourseResponse]
)
async def get_courses_api(
    db: AsyncSession = Depends(get_db)
):
    return await get_all_courses(db)


# =========================================================
# 3. GET COURSE BY ID
# =========================================================

@router.get(
    "/{course_id}",
    response_model=CourseResponse
)
async def get_course_api(
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


# =========================================================
# 4. UPDATE COURSE
# =========================================================

@router.put(
    "/{course_id}",
    response_model=CourseResponse
)
async def update_course_api(
    course_id: int,
    course: CourseUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_course(
            db,
            course_id,
            course
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# 5. DELETE COURSE
# =========================================================

@router.delete(
    "/{course_id}"
)
async def delete_course_api(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await delete_course(
            db,
            course_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# 6. PUBLISH / UNPUBLISH COURSE
# =========================================================

@router.patch(
    "/{course_id}/status",
    response_model=CourseResponse
)
async def update_status_api(
    course_id: int,
    data: CourseStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_course_status(
            db,
            course_id,
            data.is_active
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# 7. VIEW ENROLLED STUDENTS
# =========================================================

@router.get(
    "/{course_id}/students",
    response_model=list[EnrolledStudentResponse]
)
async def view_enrolled_students(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_enrolled_students(
        db,
        course_id
    )


# =========================================================
# 8. VIEW COURSE COMPLETION STATUS
# =========================================================

@router.get(
    "/{course_id}/completion",
    response_model=list[CourseCompletionResponse]
)
async def view_course_completion(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_course_completion_status(
        db,
        course_id
    )