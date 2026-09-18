import random
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.services.question_bank_policy import get_verified_question_pool

async def get_topic_practice_mcqs(
    db: AsyncSession,
    unit_id: int | None = None,
    topic_name: str | None = None,
    unit_ids: list[int] | None = None,
    course_id: int | None = None,
) -> dict:
    target_topic = topic_name
    matched_unit_id = unit_id

    if unit_id and not topic_name:
        unit = await db.scalar(
            select(LearningUnit)
            .join(CourseDay, LearningUnit.day_id == CourseDay.id)
            .where(
                LearningUnit.id == unit_id,
                course_id is None or CourseDay.course_id == course_id,
            )
        )
        if not unit:
            return {
                "unit_id": matched_unit_id,
                "topic": target_topic or "Java Practice",
                "total_mcqs": 0,
                "low_count": 0,
                "medium_count": 0,
                "hard_count": 0,
                "mcqs": [],
            }
        target_topic = unit.title
        unit_ids = [unit_id]

    questions = await get_verified_question_pool(
        db,
        course_id=course_id,
        learning_unit_ids=unit_ids,
        topic_names=[target_topic] if target_topic and not unit_ids else None,
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No verified question-bank questions are mapped to this course/topic/learning unit.",
        )

    # Use every available mapped question when a topic has fewer than 25.
    selected = random.sample(questions, min(25, len(questions)))
    random.shuffle(selected)

    formatted_mcqs = []
    for idx, q in enumerate(selected, start=1):
        # Original options map
        opts_map = {
            "A": q.option_a,
            "B": q.option_b,
            "C": q.option_c,
            "D": q.option_d,
        }
        correct_text = opts_map.get((q.correct_answer or "A").upper().strip(), q.option_a)
        if q.correct_answer_text and q.correct_answer_text.strip():
            correct_text = q.correct_answer_text.strip()

        # Build list of 4 options
        original_options = [q.option_a, q.option_b, q.option_c, q.option_d]
        
        # Shuffle options
        shuffled_options = list(original_options)
        random.shuffle(shuffled_options)

        # Find new index of correct answer
        try:
            correct_idx = shuffled_options.index(correct_text)
        except ValueError:
            # If exact match not in list (rare fallback), place correct_text at index 0 or find closest match
            shuffled_options[0] = correct_text
            correct_idx = 0

        diff_str = (q.difficulty or "MEDIUM").lower()
        if diff_str not in ["low", "medium", "hard"]:
            diff_str = "low" if diff_str == "easy" else diff_str

        formatted_mcqs.append({
            "id": q.id,
            "question_number": idx,
            "question": q.question_text,
            "options": shuffled_options,
            "correct_index": correct_idx,
            "explanation": q.explanation or f"The correct answer is '{correct_text}'.",
            "difficulty": diff_str,
            "question_type": q.question_type or "Concept",
            "topic": q.topic,
            "subtopic": q.subtopic or ""
        })

    return {
        "unit_id": matched_unit_id,
        "topic": target_topic or "Java Practice",
        "total_mcqs": len(formatted_mcqs),
        "low_count": len([m for m in formatted_mcqs if m["difficulty"] in ["low", "easy"]]),
        "medium_count": len([m for m in formatted_mcqs if m["difficulty"] == "medium"]),
        "hard_count": len([m for m in formatted_mcqs if m["difficulty"] == "hard"]),
        "mcqs": formatted_mcqs
    }
