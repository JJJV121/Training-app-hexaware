from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lesson_qa import LessonQA
from app.models.content import Content


async def get_qa_by_learning_unit(
    db: AsyncSession,
    learning_unit_id: int
):
    result = await db.scalars(
        select(LessonQA).where(
            LessonQA.learning_unit_id == learning_unit_id
        )
    )

    return result.all()


async def get_notes_by_learning_unit(
    db: AsyncSession,
    learning_unit_id: int
):
    result = await db.scalars(
        select(Content).where(
            Content.learning_unit_id == learning_unit_id
        )
    )

    return result.all()