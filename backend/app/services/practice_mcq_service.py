import random
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.services.mcq_generator_service import generate_25_mcqs_for_day
from app.services.question_bank_policy import get_question_pool, normalize_difficulty


def _format_bank_question(q, idx: int) -> dict:
    opts_map = {
        "A": q.option_a,
        "B": q.option_b,
        "C": q.option_c,
        "D": q.option_d,
    }
    correct_answers = {
        answer.strip() for answer in (q.correct_answer or "A").upper().split(",") if answer.strip()
    }
    correct_text = ", ".join(opts_map[answer] for answer in sorted(correct_answers) if answer in opts_map)
    if q.correct_answer_text and q.correct_answer_text.strip():
        correct_text = q.correct_answer_text.strip()

    shuffled_options = [q.option_a, q.option_b, q.option_c, q.option_d]
    random.shuffle(shuffled_options)
    correct_texts = [opts_map[answer] for answer in correct_answers if answer in opts_map]
    correct_indices = [
        index for index, option in enumerate(shuffled_options)
        if option in correct_texts
    ]
    correct_idx = correct_indices[0] if correct_indices else 0

    diff_str = normalize_difficulty(q.difficulty).lower()
    if diff_str == "easy":
        diff_str = "low"

    return {
        "id": q.id,
        "question_number": idx,
        "question": q.question_text,
        "options": shuffled_options,
        "correct_index": correct_idx,
        "correct_indices": correct_indices,
        "explanation": q.explanation or f"The correct answer is '{correct_text}'.",
        "difficulty": diff_str,
        "question_type": q.question_type or "Concept",
        "topic": q.topic,
        "subtopic": q.subtopic or "",
    }


def _format_generated_question(item: dict, idx: int, topic: str) -> dict:
    options = list(item.get("options") or [])
    while len(options) < 4:
        options.append("")
    shuffled = options[:4]
    original_correct = options[int(item.get("correct_index") or 0)] if options else ""
    random.shuffle(shuffled)
    correct_indices = [i for i, option in enumerate(shuffled) if option == original_correct]
    diff_str = str(item.get("difficulty") or "low").lower()
    if diff_str == "easy":
        diff_str = "low"
    return {
        "id": f"generated-{idx}",
        "question_number": idx,
        "question": item.get("question"),
        "options": shuffled,
        "correct_index": correct_indices[0] if correct_indices else 0,
        "correct_indices": correct_indices,
        "explanation": item.get("explanation") or "",
        "difficulty": diff_str,
        "question_type": "Concept",
        "topic": topic,
        "subtopic": "",
    }


async def get_topic_practice_mcqs(
    db: AsyncSession,
    unit_id: int | None = None,
    topic_name: str | None = None,
    unit_ids: list[int] | None = None,
    course_id: int | None = None,
) -> dict:
    target_topic = topic_name
    matched_unit_id = unit_id
    course_title = "Training Course"
    day_title = target_topic or "Practice"
    day_desc = ""

    if unit_id and not topic_name:
        query = select(LearningUnit).join(CourseDay, LearningUnit.day_id == CourseDay.id).where(LearningUnit.id == unit_id)
        if course_id is not None:
            query = query.where(CourseDay.course_id == course_id)
        unit = await db.scalar(query)
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
        day_title = unit.title
        day_desc = unit.description or ""
        unit_ids = [unit_id]
        day = await db.get(CourseDay, unit.day_id)
        if day:
            course = await db.get(Course, day.course_id)
            if course:
                course_title = course.title
            if course_id is None:
                course_id = day.course_id

    if unit_ids and course_id is None:
        day_id = await db.scalar(select(LearningUnit.day_id).where(LearningUnit.id == unit_ids[0]))
        if day_id:
            course_id = await db.scalar(select(CourseDay.course_id).where(CourseDay.id == day_id))
            day = await db.get(CourseDay, day_id)
            if day:
                day_title = day.title
                day_desc = day.description or ""
                course = await db.get(Course, day.course_id)
                if course:
                    course_title = course.title

    db_questions = await get_question_pool(
        db,
        course_id=course_id,
        learning_unit_ids=unit_ids,
        topic_names=[target_topic] if target_topic else None,
        difficulties=["EASY", "LOW"],
    )

    selected = random.sample(db_questions, min(25, len(db_questions))) if db_questions else []
    formatted_mcqs = [_format_bank_question(q, idx) for idx, q in enumerate(selected, start=1)]
    used_texts = {item["question"].strip().casefold() for item in formatted_mcqs if item.get("question")}

    if len(formatted_mcqs) < 25:
        generated = generate_25_mcqs_for_day(course_title, day_title or target_topic or "", day_desc)
        generated.sort(key=lambda item: {"low": 0, "easy": 0, "medium": 1, "hard": 2}.get(str(item.get("difficulty") or "").lower(), 9))
        for item in generated:
            question_text = (item.get("question") or "").strip()
            if not question_text or question_text.casefold() in used_texts:
                continue
            formatted_mcqs.append(_format_generated_question(item, len(formatted_mcqs) + 1, target_topic or day_title))
            used_texts.add(question_text.casefold())
            if len(formatted_mcqs) >= 25:
                break

    if not formatted_mcqs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No verified question-bank questions are mapped to this course/topic/learning unit.",
        )

    formatted_mcqs = formatted_mcqs[:25]
    random.shuffle(formatted_mcqs)
    for idx, item in enumerate(formatted_mcqs, start=1):
        item["question_number"] = idx

    return {
        "unit_id": matched_unit_id,
        "topic": target_topic or "Java Practice",
        "total_mcqs": len(formatted_mcqs),
        "low_count": len([m for m in formatted_mcqs if m["difficulty"] in ["low", "easy"]]),
        "medium_count": len([m for m in formatted_mcqs if m["difficulty"] == "medium"]),
        "hard_count": len([m for m in formatted_mcqs if m["difficulty"] == "hard"]),
        "mcqs": formatted_mcqs
    }
