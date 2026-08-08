from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcq_models import MCQQuestion
from app.schemas.mcq_schemas import (
    QuestionCreate,
    QuestionUpdate,
)


# ==========================================================
# CREATE QUESTION
# ==========================================================

async def create_question(
    db: AsyncSession,
    question: QuestionCreate
):

    new_question = MCQQuestion(
        question_text=question.question_text,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_option=question.correct_option,
        topic=question.topic,
        difficulty=question.difficulty,
        marks=question.marks,
        created_by=question.created_by,
        is_active=True
    )

    db.add(new_question)

    await db.commit()
    await db.refresh(new_question)

    return new_question


# ==========================================================
# GET ALL QUESTIONS
# ==========================================================

async def get_all_questions(
    db: AsyncSession
):

    result = await db.scalars(
        select(MCQQuestion)
        .order_by(MCQQuestion.created_at.desc())
    )

    return result.all()


# ==========================================================
# GET QUESTION BY ID
# ==========================================================

async def get_question_by_id(
    db: AsyncSession,
    question_id: int
):

    question = await db.scalar(
        select(MCQQuestion)
        .where(
            MCQQuestion.id == question_id
        )
    )

    if not question:
        raise ValueError(
            "Question not found"
        )

    return question


# ==========================================================
# GET QUESTIONS BY TOPIC
# ==========================================================

async def get_questions_by_topic(
    db: AsyncSession,
    topic: str
):

    result = await db.scalars(

        select(MCQQuestion)
        .where(
            MCQQuestion.topic == topic,
            MCQQuestion.is_active == True
        )
        .order_by(
            MCQQuestion.created_at.desc()
        )

    )

    return result.all()


# ==========================================================
# GET QUESTIONS BY DIFFICULTY
# ==========================================================

async def get_questions_by_difficulty(
    db: AsyncSession,
    difficulty: str
):

    result = await db.scalars(

        select(MCQQuestion)
        .where(
            MCQQuestion.difficulty == difficulty,
            MCQQuestion.is_active == True
        )
        .order_by(
            MCQQuestion.created_at.desc()
        )

    )

    return result.all()


# ==========================================================
# SEARCH QUESTIONS
# ==========================================================

async def search_questions(
    db: AsyncSession,
    keyword: str
):

    result = await db.scalars(

        select(MCQQuestion)
        .where(

            or_(

                MCQQuestion.question_text.ilike(
                    f"%{keyword}%"
                ),

                MCQQuestion.topic.ilike(
                    f"%{keyword}%"
                ),

                MCQQuestion.difficulty.ilike(
                    f"%{keyword}%"
                )

            )

        )
        .order_by(
            MCQQuestion.created_at.desc()
        )

    )

    return result.all()

# ==========================================================
# UPDATE QUESTION
# ==========================================================

async def update_question(
    db: AsyncSession,
    question_id: int,
    question_data: QuestionUpdate
):

    question = await db.scalar(
        select(MCQQuestion).where(
            MCQQuestion.id == question_id
        )
    )

    if not question:
        raise ValueError(
            "Question not found"
        )

    update_data = question_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(question, key, value)

    await db.commit()
    await db.refresh(question)

    return question


# ==========================================================
# DELETE QUESTION
# ==========================================================

async def delete_question(
    db: AsyncSession,
    question_id: int
):

    question = await db.scalar(
        select(MCQQuestion).where(
            MCQQuestion.id == question_id
        )
    )

    if not question:
        raise ValueError(
            "Question not found"
        )

    await db.delete(question)
    await db.commit()

    return {
        "message": "Question deleted successfully"
    }


# ==========================================================
# GET ACTIVE QUESTIONS
# ==========================================================

async def get_active_questions(
    db: AsyncSession
):

    result = await db.scalars(

        select(MCQQuestion)
        .where(
            MCQQuestion.is_active == True
        )
        .order_by(
            MCQQuestion.created_at.desc()
        )

    )

    return result.all()


# ==========================================================
# SEARCH & FILTER QUESTIONS
# ==========================================================

async def search_filter_questions(
    db: AsyncSession,
    topic: str | None = None,
    difficulty: str | None = None,
    search: str | None = None
):

    query = select(MCQQuestion)

    if topic:

        query = query.where(
            MCQQuestion.topic.ilike(
                f"%{topic}%"
            )
        )

    if difficulty:

        query = query.where(
            MCQQuestion.difficulty.ilike(
                f"%{difficulty}%"
            )
        )

    if search:

        query = query.where(

            or_(

                MCQQuestion.question_text.ilike(
                    f"%{search}%"
                ),

                MCQQuestion.topic.ilike(
                    f"%{search}%"
                )

            )

        )

    query = query.order_by(
        MCQQuestion.created_at.desc()
    )

    result = await db.scalars(query)

    return result.all()


# ==========================================================
# TOGGLE QUESTION STATUS
# ==========================================================

async def toggle_question_status(
    db: AsyncSession,
    question_id: int
):

    question = await db.scalar(

        select(MCQQuestion)
        .where(
            MCQQuestion.id == question_id
        )

    )

    if not question:
        raise ValueError(
            "Question not found"
        )

    question.is_active = not question.is_active

    await db.commit()
    await db.refresh(question)

    return question


# ==========================================================
# QUESTION COUNT
# ==========================================================

async def get_question_count(
    db: AsyncSession
):

    result = await db.scalars(
        select(MCQQuestion)
    )

    questions = result.all()

    return {
        "total_questions": len(questions),
        "active_questions": len(
            [q for q in questions if q.is_active]
        ),
        "inactive_questions": len(
            [q for q in questions if not q.is_active]
        )
    }