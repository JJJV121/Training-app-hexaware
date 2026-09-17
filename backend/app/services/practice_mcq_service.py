import random
from fastapi import HTTPException, status
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcq_bank import MCQQuestionBank
from app.models.learning_unit import LearningUnit

async def get_topic_practice_mcqs(
    db: AsyncSession,
    unit_id: int | None = None,
    topic_name: str | None = None
) -> dict:
    target_topic = topic_name
    matched_unit_id = unit_id

    if unit_id and not topic_name:
        unit = await db.get(LearningUnit, unit_id)
        if unit:
            target_topic = unit.title

    # Query matching questions from MCQ Question Bank
    query = select(MCQQuestionBank).where(MCQQuestionBank.is_active == True)

    conditions = []
    if matched_unit_id:
        conditions.append(MCQQuestionBank.learning_unit_id == matched_unit_id)
    if target_topic:
        clean_topic = target_topic.strip()
        conditions.append(func.lower(MCQQuestionBank.topic) == clean_topic.lower())
        conditions.append(MCQQuestionBank.topic.ilike(f"%{clean_topic}%"))

    if conditions:
        query = query.where(or_(*conditions))

    res = await db.execute(query)
    questions = res.scalars().all()

    # Fallback search if exact match returned less than 10 questions
    if len(questions) < 10 and target_topic:
        # Search by keyword
        words = [w for w in target_topic.lower().replace("&", " ").replace("-", " ").replace("/", " ").split() if len(w) > 2]
        if words:
            word_conditions = [MCQQuestionBank.topic.ilike(f"%{w}%") for w in words] + [MCQQuestionBank.subtopic.ilike(f"%{w}%") for w in words]
            fallback_query = select(MCQQuestionBank).where(
                MCQQuestionBank.is_active == True,
                or_(*word_conditions)
            )
            fallback_res = await db.execute(fallback_query)
            questions = fallback_res.scalars().all()

    # Generic fallback if still no questions
    if not questions:
        fallback_res = await db.execute(select(MCQQuestionBank).where(MCQQuestionBank.is_active == True).limit(50))
        questions = fallback_res.scalars().all()

    # Pick 25 questions randomly (or all if fewer than 25)
    sample_size = min(25, len(questions))
    selected = random.sample(questions, sample_size)
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
