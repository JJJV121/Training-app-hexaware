from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.course_day_qa import CourseDayQA
from app.models.course_day import CourseDay
from app.schemas.course_day_qa_schemas import (
    CourseDayQACreate,
    CourseDayQAUpdate,
    CourseDayQAResponse
)

router = APIRouter(
    prefix="/qa",
    tags=["Course Day Q&A"]
)

# Create Course Day Q&A (Admin Only)
@router.post("/", response_model=CourseDayQAResponse, status_code=status.HTTP_201_CREATED)
async def create_course_day_qa(
    payload: CourseDayQACreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create Q&A items."
        )

    # Validate Course Day exists
    day = await db.get(CourseDay, payload.course_day_id)
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course day not found."
        )

    qa = CourseDayQA(
        course_day_id=payload.course_day_id,
        question=payload.question,
        answer=payload.answer,
        created_by=current_user.id
    )

    db.add(qa)
    await db.commit()
    await db.refresh(qa)
    return qa

# Get All Q&As (Admin Only)
@router.get("/", response_model=list[CourseDayQAResponse])
async def get_all_qas(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all Q&As."
        )
    result = await db.execute(select(CourseDayQA))
    return result.scalars().all()

# Get Q&As for a specific day (Open to enrolled trainees)
@router.get("/course/{course_id}/day/{day_id}", response_model=list[CourseDayQAResponse])
async def get_day_qas(
    course_id: int,
    day_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate Course Day belongs to the Course
    day = await db.scalar(
        select(CourseDay).where(
            CourseDay.id == day_id,
            CourseDay.course_id == course_id
        )
    )
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course day not found for this course."
        )

    # Auto-process day content checking first
    from app.services.day_processor_service import process_course_day
    await process_course_day(db, course_id, day_id)

    result = await db.execute(
        select(CourseDayQA).where(
            CourseDayQA.course_day_id == day_id
        )
    )
    return result.scalars().all()


# Get 25 MCQs (Low, Medium, Hard) for a specific course day
@router.get("/course/{course_id}/day/{day_id}/mcqs")
async def get_day_mcqs(
    course_id: int,
    day_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    day = await db.scalar(
        select(CourseDay).where(
            CourseDay.id == day_id,
            CourseDay.course_id == course_id
        )
    )
    if not day:
        # Fallback fetch by day_id
        day = await db.scalar(select(CourseDay).where(CourseDay.id == day_id))

    day_title = day.title if day else f"Day {day_id}"
    day_desc = day.description if day else ""

    from app.models.course import Course
    c_res = await db.execute(select(Course).where(Course.id == course_id))
    c = c_res.scalars().first()
    course_title = c.title if c else "Java Training"

    from app.services.mcq_generator_service import generate_25_mcqs_for_day
    mcqs = generate_25_mcqs_for_day(course_title, day_title, day_desc)

    return {
        "course_id": course_id,
        "day_id": day_id,
        "total_mcqs": len(mcqs),
        "low_count": len([m for m in mcqs if m["difficulty"] == "low"]),
        "medium_count": len([m for m in mcqs if m["difficulty"] == "medium"]),
        "hard_count": len([m for m in mcqs if m["difficulty"] == "hard"]),
        "mcqs": mcqs
    }


# Update Q&A (Admin Only)
@router.put("/{id}", response_model=CourseDayQAResponse)
async def update_course_day_qa(
    id: int,
    payload: CourseDayQAUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update Q&A items."
        )

    qa = await db.get(CourseDayQA, id)
    if not qa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Q&A item not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(qa, key, val)

    await db.commit()
    await db.refresh(qa)
    return qa

# Delete Q&A (Admin Only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course_day_qa(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete Q&A items."
        )

    qa = await db.get(CourseDayQA, id)
    if not qa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Q&A item not found."
        )

    await db.delete(qa)
    await db.commit()
