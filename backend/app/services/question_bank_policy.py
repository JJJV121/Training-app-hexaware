from sqlalchemy import or_, select

from app.models.mcq_bank import MCQQuestionBank


def normalize_question_text(value: str | None) -> str:
    return " ".join((value or "").lower().split())


def normalize_difficulty(value: str | None) -> str:
    raw = (value or "").strip().upper()
    if raw in {"LOW", "EASY"}:
        return "EASY"
    if raw in {"MED", "MEDIUM"}:
        return "MEDIUM"
    if raw in {"HIGH", "HARD"}:
        return "HARD"
    return raw


async def get_question_pool(
    db,
    categories: list[str] | None = None,
    course_id: int | None = None,
    learning_unit_ids: list[int] | None = None,
    topic_names: list[str] | None = None,
    difficulties: list[str] | None = None,
):
    """Load active MCQs from the database that match the current curriculum mapping."""
    query = select(MCQQuestionBank).where(MCQQuestionBank.is_active.is_(True))
    if categories:
        query = query.where(MCQQuestionBank.category.in_(categories))
    if course_id is not None:
        query = query.where(MCQQuestionBank.course_id == course_id)

    mapped_conditions = []
    if learning_unit_ids:
        mapped_conditions.append(MCQQuestionBank.learning_unit_id.in_(learning_unit_ids))
    if topic_names:
        normalized_topics = [normalize_question_text(topic) for topic in topic_names if topic]
        if normalized_topics:
            mapped_conditions.append(
                or_(*[
                    MCQQuestionBank.topic.ilike(f"%{topic}%")
                    for topic in normalized_topics
                ])
            )
    if mapped_conditions:
        query = query.where(or_(*mapped_conditions))

    rows = (await db.execute(query)).scalars().all()
    if not difficulties:
        return list(rows)

    allowed = {normalize_difficulty(item) for item in difficulties}
    return [row for row in rows if normalize_difficulty(row.difficulty) in allowed]


async def get_verified_question_pool(
    db,
    categories: list[str] | None = None,
    course_id: int | None = None,
    learning_unit_ids: list[int] | None = None,
    topic_names: list[str] | None = None,
    difficulties: list[str] | None = None,
):
    return await get_question_pool(
        db,
        categories=categories,
        course_id=course_id,
        learning_unit_ids=learning_unit_ids,
        topic_names=topic_names,
        difficulties=difficulties,
    )
