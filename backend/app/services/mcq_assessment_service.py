from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcq_models import MCQAssessment, MCQQuestion
from app.schemas.mcq_schemas import AssessmentCreate, AssessmentUpdate


async def create_assessment(db: AsyncSession, assessment: AssessmentCreate):
    obj = MCQAssessment(
        title=assessment.title,
        description=assessment.description,
        duration_minutes=assessment.duration_minutes,
        total_questions=assessment.total_questions,
        pass_percentage=assessment.pass_percentage,
        unlock_after_days=assessment.unlock_after_days,
        topic_distribution=assessment.topic_distribution,
        status="Draft",
        created_by=assessment.created_by,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_all_assessments(db: AsyncSession):
    return (
        await db.scalars(
            select(MCQAssessment).order_by(MCQAssessment.created_at.desc())
        )
    ).all()


async def get_assessment_by_id(db: AsyncSession, assessment_id: int):
    assessment = await db.scalar(
        select(MCQAssessment).where(MCQAssessment.id == assessment_id)
    )
    if not assessment:
        raise ValueError("Assessment not found")
    return assessment


async def update_assessment(db: AsyncSession, assessment_id: int, assessment_data: AssessmentUpdate):
    assessment = await get_assessment_by_id(db, assessment_id)
    for k, v in assessment_data.model_dump(exclude_unset=True).items():
        setattr(assessment, k, v)
    await db.commit()
    await db.refresh(assessment)
    return assessment


async def delete_assessment(db: AsyncSession, assessment_id: int):
    assessment = await get_assessment_by_id(db, assessment_id)
    await db.delete(assessment)
    await db.commit()
    return {"message": "Assessment deleted successfully"}


async def validate_question_availability(db: AsyncSession, assessment_id: int):
    assessment = await get_assessment_by_id(db, assessment_id)
    topic_distribution = assessment.topic_distribution or {}
    topics = list(topic_distribution.keys())
    if not topics:
        return []

    rows = (
        await db.execute(
            select(
                MCQQuestion.topic,
                func.count(MCQQuestion.id).label("cnt")
            )
            .where(
                MCQQuestion.is_active.is_(True),
                MCQQuestion.topic.in_(topics),
            )
            .group_by(MCQQuestion.topic)
        )
    ).all()

    counts = {topic: cnt for topic, cnt in rows}

    return [
        {
            "topic": topic,
            "required": required,
            "available": counts.get(topic, 0),
            "status": counts.get(topic, 0) >= required,
        }
        for topic, required in topic_distribution.items()
    ]


async def publish_assessment(db: AsyncSession, assessment_id: int):
    assessment = await get_assessment_by_id(db, assessment_id)

    if assessment.status == "Published":
        raise ValueError("Assessment already published")

    validation = await validate_question_availability(db, assessment_id)
    failed = [v for v in validation if not v["status"]]

    if failed:
        msg = ", ".join(
            f'{i["topic"]} (Required: {i["required"]}, Available: {i["available"]})'
            for i in failed
        )
        raise ValueError(f"Insufficient questions available: {msg}")

    assessment.status = "Published"
    assessment.published_at = datetime.utcnow()
    await db.commit()
    await db.refresh(assessment)

    return {
        "message": "Assessment published successfully",
        "assessment": assessment,
    }


async def get_published_assessments(db: AsyncSession):
    return (
        await db.scalars(
            select(MCQAssessment)
            .where(MCQAssessment.status == "Published")
            .order_by(MCQAssessment.published_at.desc())
        )
    ).all()


async def get_available_assessments(db: AsyncSession):
    return (
        await db.scalars(
            select(MCQAssessment)
            .where(MCQAssessment.status == "Published")
            .order_by(MCQAssessment.created_at.desc())
        )
    ).all()


async def get_assessment_statistics(db: AsyncSession):
    total, published, draft = (
        await db.execute(
            select(
                func.count(MCQAssessment.id),
                func.sum(case((MCQAssessment.status == "Published", 1), else_=0)),
                func.sum(case((MCQAssessment.status == "Draft", 1), else_=0)),
            )
        )
    ).one()

    return {
        "total_assessments": total or 0,
        "published_assessments": published or 0,
        "draft_assessments": draft or 0,
    }


async def assessment_exists(db: AsyncSession, assessment_id: int):
    return (
        await db.scalar(
            select(func.count()).select_from(MCQAssessment).where(MCQAssessment.id == assessment_id)
        )
    ) > 0