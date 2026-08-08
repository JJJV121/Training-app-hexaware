from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment

async def create_assessment(
    db: AsyncSession,
    data
):
    assessment = Assessment(
        title=data.title,
        description=data.description,
        course_id=data.course_id,
        day_id=data.day_id,
        duration_minutes=data.duration_minutes,
        total_marks=data.total_marks,
        pass_percentage=data.pass_percentage,
        start_time=data.start_time,
        end_time=data.end_time,
        created_by=data.created_by
    )

    db.add(assessment)

    await db.commit()

    await db.refresh(assessment)

    return assessment

async def get_assessment(
    db: AsyncSession,
    assessment_id: int
):
    assessment = await db.scalar(
        select(Assessment).where(
            Assessment.id == assessment_id
        )
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    return assessment

async def get_all_assessments(
    db: AsyncSession
):
    result = await db.scalars(
        select(Assessment)
    )

    return result.all()

async def publish_assessment(
    db: AsyncSession,
    assessment_id: int
):
    assessment = await db.scalar(
        select(Assessment).where(
            Assessment.id == assessment_id
        )
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    assessment.is_published = True

    await db.commit()

    await db.refresh(assessment)

    return {
        "message":
        "Assessment published successfully"
    }

async def delete_assessment(
    db: AsyncSession,
    assessment_id: int
):
    assessment = await db.scalar(
        select(Assessment).where(
            Assessment.id == assessment_id
        )
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    await db.delete(assessment)

    await db.commit()

    return {
        "message":
        "Assessment deleted successfully"
    }