from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.case_study import CaseStudy
from app.models.course_day import CourseDay
from app.schemas.case_study_schemas import (
    CaseStudyCreate,
    CaseStudyUpdate,
    CaseStudyResponse
)

router = APIRouter(
    prefix="/case-studies",
    tags=["Case Study Management"]
)

# Create Case Study (Admin Only)
@router.post("/", response_model=CaseStudyResponse, status_code=status.HTTP_201_CREATED)
async def create_case_study(
    payload: CaseStudyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create case studies."
        )

    # Validate Course Day exists
    day = await db.get(CourseDay, payload.course_day_id)
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course day not found."
        )

    case_study = CaseStudy(
        course_day_id=payload.course_day_id,
        title=payload.title,
        scenario=payload.scenario,
        requirements=payload.requirements,
        total_marks=payload.total_marks,
        due_date=payload.due_date,
        created_by=current_user.id
    )

    db.add(case_study)
    await db.commit()
    await db.refresh(case_study)
    return case_study

# Get All Case Studies (Admin Only)
@router.get("/", response_model=list[CaseStudyResponse])
async def get_all_case_studies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all case studies."
        )
    result = await db.execute(select(CaseStudy))
    return result.scalars().all()

# Get Case Studies for a day
@router.get("/course/{course_id}/day/{day_id}", response_model=list[CaseStudyResponse])
async def get_day_case_studies(
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
        select(CaseStudy).where(
            CaseStudy.course_day_id == day_id
        )
    )
    return result.scalars().all()

# Update Case Study (Admin Only)
@router.put("/{id}", response_model=CaseStudyResponse)
async def update_case_study(
    id: int,
    payload: CaseStudyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update case studies."
        )

    case_study = await db.get(CaseStudy, id)
    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(case_study, key, val)

    await db.commit()
    await db.refresh(case_study)
    return case_study

# Delete Case Study (Admin Only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete case studies."
        )

    case_study = await db.get(CaseStudy, id)
    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found."
        )

    await db.delete(case_study)
    await db.commit()
