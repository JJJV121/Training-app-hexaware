from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcq_models import (
    MCQAssessment,
    MCQQuestion
)

from app.schemas.mcq_schemas import (
    AssessmentCreate,
    AssessmentUpdate
)


# ==========================================================
# CREATE ASSESSMENT
# ==========================================================

async def create_assessment(
    db: AsyncSession,
    assessment: AssessmentCreate
):

    new_assessment = MCQAssessment(
        title=assessment.title,
        description=assessment.description,
        duration_minutes=assessment.duration_minutes,
        total_questions=assessment.total_questions,
        pass_percentage=assessment.pass_percentage,
        unlock_after_days=assessment.unlock_after_days,
        topic_distribution=assessment.topic_distribution,
        status="Draft",
        created_by=assessment.created_by
    )

    db.add(new_assessment)

    await db.commit()
    await db.refresh(new_assessment)

    return new_assessment


# ==========================================================
# GET ALL ASSESSMENTS
# ==========================================================

async def get_all_assessments(
    db: AsyncSession
):

    result = await db.scalars(

        select(MCQAssessment)
        .order_by(
            MCQAssessment.created_at.desc()
        )

    )

    return result.all()


# ==========================================================
# GET ASSESSMENT BY ID
# ==========================================================

async def get_assessment_by_id(
    db: AsyncSession,
    assessment_id: int
):

    assessment = await db.scalar(

        select(MCQAssessment)
        .where(
            MCQAssessment.id == assessment_id
        )

    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    return assessment


# ==========================================================
# UPDATE ASSESSMENT
# ==========================================================

async def update_assessment(
    db: AsyncSession,
    assessment_id: int,
    assessment_data: AssessmentUpdate
):

    assessment = await db.scalar(

        select(MCQAssessment)
        .where(
            MCQAssessment.id == assessment_id
        )

    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    update_data = assessment_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            assessment,
            key,
            value
        )

    await db.commit()
    await db.refresh(
        assessment
    )

    return assessment


# ==========================================================
# DELETE ASSESSMENT
# ==========================================================

async def delete_assessment(
    db: AsyncSession,
    assessment_id: int
):

    assessment = await db.scalar(

        select(MCQAssessment)
        .where(
            MCQAssessment.id == assessment_id
        )

    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    await db.delete(
        assessment
    )

    await db.commit()

    return {
        "message":
        "Assessment deleted successfully"
    }


# ==========================================================
# VALIDATE QUESTION AVAILABILITY
# ==========================================================

async def validate_question_availability(
    db: AsyncSession,
    assessment_id: int
):

    assessment = await db.scalar(

        select(MCQAssessment)
        .where(
            MCQAssessment.id == assessment_id
        )

    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    topic_distribution = assessment.topic_distribution

    validation_result = []

    for topic, required_count in topic_distribution.items():

        available_questions = await db.scalar(

            select(
                func.count(
                    MCQQuestion.id
                )
            )
            .where(
                MCQQuestion.topic == topic,
                MCQQuestion.is_active == True
            )

        )

        available_questions = (
            available_questions or 0
        )

        validation_result.append({

            "topic":
                topic,

            "required":
                required_count,

            "available":
                available_questions,

            "status":
                available_questions >= required_count

        })

    return validation_result

# ==========================================================
# PUBLISH ASSESSMENT
# ==========================================================

async def publish_assessment(
    db: AsyncSession,
    assessment_id: int
):

    assessment = await db.scalar(
        select(MCQAssessment).where(
            MCQAssessment.id == assessment_id
        )
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    if assessment.status == "Published":
        raise ValueError(
            "Assessment already published"
        )

    validation = await validate_question_availability(
        db,
        assessment_id
    )

    failed_topics = [
        item
        for item in validation
        if not item["status"]
    ]

    if failed_topics:

        message = ", ".join(
            [
                f'{item["topic"]} '
                f'(Required: {item["required"]}, '
                f'Available: {item["available"]})'
                for item in failed_topics
            ]
        )

        raise ValueError(
            f"Insufficient questions available: {message}"
        )

    assessment.status = "Published"
    assessment.published_at = datetime.utcnow()

    await db.commit()
    await db.refresh(assessment)

    return {
        "message": "Assessment published successfully",
        "assessment": assessment
    }


# ==========================================================
# GET PUBLISHED ASSESSMENTS
# ==========================================================

async def get_published_assessments(
    db: AsyncSession
):

    result = await db.scalars(

        select(MCQAssessment)
        .where(
            MCQAssessment.status == "Published"
        )
        .order_by(
            MCQAssessment.published_at.desc()
        )

    )

    return result.all()


# ==========================================================
# GET AVAILABLE ASSESSMENTS
# ==========================================================

async def get_available_assessments(
    db: AsyncSession
):

    result = await db.scalars(

        select(MCQAssessment)
        .where(
            MCQAssessment.status == "Published"
        )
        .order_by(
            MCQAssessment.created_at.desc()
        )

    )

    return result.all()


# ==========================================================
# ASSESSMENT STATISTICS
# ==========================================================

async def get_assessment_statistics(
    db: AsyncSession
):

    total_assessments = await db.scalar(
        select(
            func.count(
                MCQAssessment.id
            )
        )
    )

    published_assessments = await db.scalar(
        select(
            func.count(
                MCQAssessment.id
            )
        ).where(
            MCQAssessment.status == "Published"
        )
    )

    draft_assessments = await db.scalar(
        select(
            func.count(
                MCQAssessment.id
            )
        ).where(
            MCQAssessment.status == "Draft"
        )
    )

    return {
        "total_assessments": total_assessments or 0,
        "published_assessments": published_assessments or 0,
        "draft_assessments": draft_assessments or 0
    }


# ==========================================================
# CHECK ASSESSMENT EXISTS
# ==========================================================

async def assessment_exists(
    db: AsyncSession,
    assessment_id: int
):

    assessment = await db.scalar(

        select(MCQAssessment)
        .where(
            MCQAssessment.id == assessment_id
        )

    )

    return assessment is not None