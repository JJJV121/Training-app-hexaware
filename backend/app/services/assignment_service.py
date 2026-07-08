from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.models.course_day import CourseDay

async def create_assignment(
    db: AsyncSession,
    data: AssignmentCreate,
    created_by: int,
    attachment_path: str,
):
    
    result = await db.execute(
    select(CourseDay).where(
        CourseDay.id == data.course_day_id
    )
)

    course_day = result.scalar_one_or_none()

    if not course_day:
        raise HTTPException(
        status_code=404,
        detail="Course day not found."
    )

    assignment = Assignment(
    course_day_id=data.course_day_id,
    title=data.title,
    description=data.description,
    assignment_type=data.assignment_type,
    instructions=data.instructions,
    attachment_path=attachment_path,
    total_marks=100,
    passing_marks=75,
    due_date=data.due_date,
    created_by=created_by,
)

    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return assignment


async def get_all_assignments(db: AsyncSession):
    result = await db.execute(select(Assignment))
    return result.scalars().all()


async def get_assignment_by_id(
    db: AsyncSession,
    assignment_id: int,
):
    result = await db.execute(
        select(Assignment).where(
            Assignment.id == assignment_id
        )
    )

    return result.scalar_one_or_none()


async def update_assignment(
    db: AsyncSession,
    assignment: Assignment,
    data: AssignmentUpdate,
    attachment_path: str | None,
):
    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(assignment, key, value)

    assignment.attachment_path = attachment_path

    await db.commit()
    await db.refresh(assignment)

    return assignment


async def delete_assignment(
    db: AsyncSession,
    assignment: Assignment,
):
    await db.delete(assignment)
    await db.commit()