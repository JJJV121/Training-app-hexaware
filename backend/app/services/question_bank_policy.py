from sqlalchemy import or_, select

from app.database.seed_data.java_mcq_bank_data import RAW_MCQ_BANK
from app.models.mcq_bank import MCQQuestionBank


def normalize_question_text(value: str | None) -> str:
    return " ".join((value or "").lower().split())


VERIFIED_QUESTION_KEYS = {
    normalize_question_text(item["question_text"])
    for item in RAW_MCQ_BANK
}


def is_verified_question(question: MCQQuestionBank) -> bool:
    return normalize_question_text(question.question_text) in VERIFIED_QUESTION_KEYS


async def get_verified_question_pool(
    db,
    categories: list[str] | None = None,
    course_id: int | None = None,
    learning_unit_ids: list[int] | None = None,
    topic_names: list[str] | None = None,
):
    query = select(MCQQuestionBank).where(MCQQuestionBank.is_active.is_(True))
    if categories:
        query = query.where(MCQQuestionBank.category.in_(categories))
    if course_id is not None:
        query = query.where(MCQQuestionBank.course_id == course_id)

    mapped_conditions = []
    if learning_unit_ids:
        mapped_conditions.append(MCQQuestionBank.learning_unit_id.in_(learning_unit_ids))
    if topic_names:
        normalized_topics = [normalize_question_text(topic) for topic in topic_names]
        mapped_conditions.append(
            or_(*[
                MCQQuestionBank.topic.ilike(topic)
                for topic in normalized_topics
                if topic
            ])
        )
    if mapped_conditions:
        query = query.where(or_(*mapped_conditions))

    rows = (await db.execute(query)).scalars().all()
    return [row for row in rows if is_verified_question(row)]