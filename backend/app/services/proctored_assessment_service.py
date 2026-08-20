from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course_day import CourseDay
from app.models.course import Course
from app.models.learning_unit import LearningUnit
from app.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentOption,
    AssessmentAttempt,
    AssessmentAnswer,
    ProctoringEvent,
    AssessmentType,
    QuestionType,
    AttemptStatus,
)
from app.services.mcq_generator_service import generate_25_mcqs_for_day


def sanitize_name(name: str) -> str:
    """Format string cleanly for test_name e.g. Python_Day_03_Functions"""
    if not name:
        return ""
    cleaned = name.strip().replace(" ", "_")
    return cleaned


async def get_or_create_day_assessment(db: AsyncSession, course_day_id: int) -> Assessment:
    """
    Retrieves or generates a proctored assessment for a given course day.
    Name format: course_day_topic e.g. Python_Day_03_Functions
    """
    # Fetch course_day and parent course
    day_stmt = (
        select(CourseDay)
        .where(CourseDay.id == course_day_id)
    )
    day_res = await db.execute(day_stmt)
    course_day = day_res.scalar_one_or_none()

    if not course_day:
        raise HTTPException(status_code=404, detail="Course day not found.")

    course_stmt = select(Course).where(Course.id == course_day.course_id)
    course_res = await db.execute(course_stmt)
    course = course_res.scalar_one_or_none()
    course_name = course.title if course else "Course"

    # Fetch first unit/topic title if available
    unit_stmt = (
        select(LearningUnit)
        .where(LearningUnit.day_id == course_day_id)
        .order_by(LearningUnit.display_order)
    )
    unit_res = await db.execute(unit_stmt)
    units = unit_res.scalars().all()
    topic_title = units[0].title if units else course_day.title

    # Form dynamic test title in required format: course_day_topic
    day_str = f"Day_{course_day.day_number:02d}"
    test_title = f"{sanitize_name(course_name)}_{day_str}_{sanitize_name(topic_title)}"

    # Check for existing assessment
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.options)
        )
        .where(Assessment.course_day_id == course_day_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        assessment = Assessment(
            course_day_id=course_day_id,
            title=test_title,
            description=f"Proctored skill assessment for {course_day.title}",
            instructions="Maintain full screen. Complete all questions before submitting.",
            created_by=1,
            assessment_type="MCQ",
            duration_minutes=30,
            total_marks=100,
            passing_marks=70,
        )
        db.add(assessment)
        await db.flush()

    # Ensure questions exist
    q_check_stmt = select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == assessment.id)
    q_check_res = await db.execute(q_check_stmt)
    existing_questions = q_check_res.scalars().all()

    if not existing_questions:
        generated_mcqs = generate_25_mcqs_for_day(
            course_title=course_name,
            day_title=course_day.title,
            day_description=course_day.description or ""
        )

        # Build 20 questions covering MCQ, MSQ, True/False, Text
        q_count = 0
        for i, item in enumerate(generated_mcqs[:20], start=1):
            q_count += 1
            # Determine question type variation
            if i % 7 == 0:
                q_type = QuestionType.TEXT.value
                question_obj = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=item["question"],
                    question_type=q_type,
                    points=5,
                    explanation=item.get("explanation", "")
                )
                db.add(question_obj)
            elif i % 5 == 0:
                q_type = QuestionType.TRUE_FALSE.value
                question_obj = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=f"True or False: {item['question']}",
                    question_type=q_type,
                    points=5,
                    explanation=item.get("explanation", "")
                )
                db.add(question_obj)
                await db.flush()

                # Add True and False options
                tf_options = [
                    AssessmentOption(question_id=question_obj.id, option_text="True", is_correct=(item.get("correct_index", 0) % 2 == 0)),
                    AssessmentOption(question_id=question_obj.id, option_text="False", is_correct=(item.get("correct_index", 0) % 2 != 0))
                ]
                db.add_all(tf_options)
            elif i % 4 == 0:
                q_type = QuestionType.MSQ.value
                question_obj = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=f"{item['question']} (Select all correct options)",
                    question_type=q_type,
                    points=5,
                    explanation=item.get("explanation", "")
                )
                db.add(question_obj)
                await db.flush()

                correct_idx = item.get("correct_index", 0)
                for opt_idx, opt_text in enumerate(item.get("options", [])):
                    # Make two options correct for MSQ
                    is_corr = (opt_idx == correct_idx) or (opt_idx == (correct_idx + 1) % len(item.get("options", [1])))
                    opt_obj = AssessmentOption(
                        question_id=question_obj.id,
                        option_text=opt_text,
                        is_correct=is_corr
                    )
                    db.add(opt_obj)
            else:
                q_type = QuestionType.MCQ.value
                question_obj = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_number=i,
                    question_text=item["question"],
                    question_type=q_type,
                    points=5,
                    explanation=item.get("explanation", "")
                )
                db.add(question_obj)
                await db.flush()

                correct_idx = item.get("correct_index", 0)
                for opt_idx, opt_text in enumerate(item.get("options", [])):
                    opt_obj = AssessmentOption(
                        question_id=question_obj.id,
                        option_text=opt_text,
                        is_correct=(opt_idx == correct_idx)
                    )
                    db.add(opt_obj)

        await db.commit()

        # Reload assessment with questions
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()

    return assessment


async def get_proctored_assessment_trainee_view(
    db: AsyncSession, assessment_id: int, user_id: int
) -> dict:
    """
    Returns trainee-safe assessment details.
    STRIPS ALL correct answers, answer keys, explanations, and solution details.
    """
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.options)
        )
        .where(Assessment.id == assessment_id)
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # Get course, day, topic info
    course_name = "Course"
    day_number = 1
    topic_name = "Topic"

    if assessment.course_day_id:
        day_stmt = select(CourseDay).where(CourseDay.id == assessment.course_day_id)
        day_res = await db.execute(day_stmt)
        day = day_res.scalar_one_or_none()
        if day:
            day_number = day.day_number
            topic_name = day.title
            course_stmt = select(Course).where(Course.id == day.course_id)
            c_res = await db.execute(course_stmt)
            c_obj = c_res.scalar_one_or_none()
            if c_obj:
                course_name = c_obj.title

    test_name = assessment.title

    # Build trainee-safe questions (NO is_correct, NO explanation)
    questions_list = []
    for q in assessment.questions:
        options_list = [
            {"id": opt.id, "text": opt.option_text}
            for opt in q.options
        ]
        questions_list.append({
            "question_id": q.id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "points": q.points,
            "options": options_list
        })

    # Check active attempt
    attempt_stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == AttemptStatus.IN_PROGRESS.value
            )
        )
    )
    att_res = await db.execute(attempt_stmt)
    active_attempt = att_res.scalar_one_or_none()

    return {
        "assessment_id": assessment.id,
        "attempt_id": active_attempt.id if active_attempt else None,
        "test_name": test_name,
        "course": course_name,
        "day": day_number,
        "topic": topic_name,
        "duration_minutes": assessment.duration_minutes,
        "total_marks": assessment.total_marks,
        "passing_marks": assessment.passing_marks,
        "questions": questions_list
    }


async def create_or_get_active_attempt(
    db: AsyncSession, assessment_id: int, user_id: int
) -> dict:
    """
    Creates or retrieves active assessment attempt for trainee.
    Enforces server-side timer calculations and state restoration on page refresh.
    """
    # 1. Fetch Assessment
    stmt = select(Assessment).where(Assessment.id == assessment_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # 2. Check existing active attempt
    att_stmt = (
        select(AssessmentAttempt)
        .options(selectinload(AssessmentAttempt.answers))
        .where(
            and_(
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == AttemptStatus.IN_PROGRESS.value
            )
        )
    )
    att_res = await db.execute(att_stmt)
    attempt = att_res.scalar_one_or_none()

    now = datetime.utcnow()

    if attempt:
        # Check server-side expiration
        if now > attempt.expires_at:
            attempt.status = AttemptStatus.EXPIRED.value
            await db.commit()
            raise HTTPException(status_code=400, detail="Your assessment attempt has expired.")
    else:
        # Check if already submitted
        sub_stmt = (
            select(AssessmentAttempt)
            .where(
                and_(
                    AssessmentAttempt.assessment_id == assessment_id,
                    AssessmentAttempt.user_id == user_id,
                    AssessmentAttempt.status == AttemptStatus.SUBMITTED.value
                )
            )
        )
        sub_res = await db.execute(sub_stmt)
        sub_attempt = sub_res.scalar_one_or_none()
        if sub_attempt:
            raise HTTPException(status_code=400, detail="This assessment has already been submitted.")

        # Create new attempt
        expires_at = now + timedelta(minutes=assessment.duration_minutes)
        attempt = AssessmentAttempt(
            user_id=user_id,
            assessment_id=assessment_id,
            status=AttemptStatus.IN_PROGRESS.value,
            current_question=0,
            started_at=now,
            expires_at=expires_at,
            total_marks=float(assessment.total_marks)
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

        # Reload with answers
        att_res = await db.execute(att_stmt)
        attempt = att_res.scalar_one_or_none()

    # Retrieve saved answers
    saved_answers = {}
    if attempt and attempt.answers:
        for ans in attempt.answers:
            saved_answers[ans.question_id] = {
                "selected_option_ids": ans.selected_option_ids or [],
                "answer_text": ans.answer_text or ""
            }

    remaining_sec = max(0, int((attempt.expires_at - now).total_seconds()))

    # Build test details
    trainee_view = await get_proctored_assessment_trainee_view(db, assessment_id, user_id)

    return {
        "attempt_id": attempt.id,
        "assessment_id": assessment.id,
        "test_name": trainee_view["test_name"],
        "course": trainee_view["course"],
        "day": trainee_view["day"],
        "topic": trainee_view["topic"],
        "duration_minutes": assessment.duration_minutes,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "expires_at": attempt.expires_at,
        "submitted_at": attempt.submitted_at,
        "current_question": attempt.current_question,
        "saved_answers": saved_answers,
        "remaining_seconds": remaining_sec
    }


async def save_answer(
    db: AsyncSession,
    attempt_id: int,
    question_id: int,
    user_id: int,
    selected_option_ids: list[int] | None = None,
    answer_text: str | None = None,
    current_question_index: int | None = None
):
    """
    Dynamically auto-saves candidate answers for an active test attempt.
    """
    stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    if attempt.status != AttemptStatus.IN_PROGRESS.value:
        raise HTTPException(status_code=400, detail="Cannot update answers for a finished or expired attempt.")

    if datetime.utcnow() > attempt.expires_at:
        attempt.status = AttemptStatus.EXPIRED.value
        await db.commit()
        raise HTTPException(status_code=400, detail="Assessment time has expired.")

    # Update current question index if provided
    if current_question_index is not None:
        attempt.current_question = current_question_index

    # Find or create answer
    ans_stmt = (
        select(AssessmentAnswer)
        .where(
            and_(
                AssessmentAnswer.attempt_id == attempt_id,
                AssessmentAnswer.question_id == question_id
            )
        )
    )
    ans_res = await db.execute(ans_stmt)
    answer = ans_res.scalar_one_or_none()

    if not answer:
        answer = AssessmentAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_ids=selected_option_ids or [],
            answer_text=answer_text or "",
            answered_at=datetime.utcnow()
        )
        db.add(answer)
    else:
        if selected_option_ids is not None:
            answer.selected_option_ids = selected_option_ids
        if answer_text is not None:
            answer.answer_text = answer_text
        answer.answered_at = datetime.utcnow()

    await db.commit()
    return {"status": "saved", "question_id": question_id}


async def record_proctoring_event(
    db: AsyncSession,
    attempt_id: int,
    user_id: int,
    event_type: str,
    timestamp: str | None = None,
    metadata_json: dict | None = None
):
    """
    Logs proctoring events (TAB_SWITCH, VISIBILITY_CHANGE, FULLSCREEN_EXIT, etc.).
    """
    stmt = (
        select(AssessmentAttempt)
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    event = ProctoringEvent(
        attempt_id=attempt_id,
        event_type=event_type,
        timestamp=datetime.utcnow(),
        metadata_json=metadata_json or {}
    )
    db.add(event)
    await db.commit()
    return {"status": "recorded", "event_type": event_type}


async def submit_attempt(db: AsyncSession, attempt_id: int, user_id: int) -> dict:
    """
    Submits and server-side evaluates test attempt.
    Locks attempt against further answer updates. Frontend NEVER calculates official score.
    """
    stmt = (
        select(AssessmentAttempt)
        .options(
            selectinload(AssessmentAttempt.assessment)
            .selectinload(Assessment.questions)
            .selectinload(AssessmentQuestion.options),
            selectinload(AssessmentAttempt.answers)
        )
        .where(
            and_(
                AssessmentAttempt.id == attempt_id,
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found.")

    if attempt.status == AttemptStatus.SUBMITTED.value:
        # Return existing submission result
        trainee_view = await get_proctored_assessment_trainee_view(db, attempt.assessment_id, user_id)
        answered_cnt = len([a for a in attempt.answers if (a.selected_option_ids or a.answer_text)])
        total_q = len(attempt.assessment.questions)
        return {
            "attempt_id": attempt.id,
            "assessment_id": attempt.assessment_id,
            "test_name": trainee_view["test_name"],
            "course": trainee_view["course"],
            "day": trainee_view["day"],
            "topic": trainee_view["topic"],
            "score": attempt.score or 0.0,
            "total_marks": attempt.total_marks or 100.0,
            "percentage": round(((attempt.score or 0.0) / (attempt.total_marks or 100.0)) * 100, 2),
            "answered_count": answered_cnt,
            "unanswered_count": total_q - answered_cnt,
            "passed": bool(attempt.passed),
            "status": attempt.status,
            "submitted_at": attempt.submitted_at or datetime.utcnow()
        }

    # Evaluate answers server-side against database `is_correct` flags
    answers_map = {ans.question_id: ans for ans in attempt.answers}
    total_score = 0.0
    total_possible_marks = 0.0
    answered_count = 0

    for question in attempt.assessment.questions:
        q_points = question.points
        total_possible_marks += q_points
        user_ans = answers_map.get(question.id)

        if not user_ans:
            continue

        sel_opts = set(user_ans.selected_option_ids or [])
        ans_txt = (user_ans.answer_text or "").strip()

        if sel_opts or ans_txt:
            answered_count += 1

        correct_opts = {opt.id for opt in question.options if opt.is_correct}
        is_q_correct = False

        if question.question_type == QuestionType.MCQ.value or question.question_type == QuestionType.TRUE_FALSE.value:
            if sel_opts and correct_opts and sel_opts == correct_opts:
                is_q_correct = True
        elif question.question_type == QuestionType.MSQ.value:
            if sel_opts and correct_opts and sel_opts == correct_opts:
                is_q_correct = True
        elif question.question_type == QuestionType.TEXT.value:
            if len(ans_txt) > 3:  # Valid text answer submitted
                is_q_correct = True

        user_ans.is_correct = is_q_correct
        user_ans.score_obtained = float(q_points) if is_q_correct else 0.0

        if is_q_correct:
            total_score += q_points

    percentage = round((total_score / total_possible_marks * 100), 2) if total_possible_marks > 0 else 0.0
    passing_percentage = (attempt.assessment.passing_marks / attempt.assessment.total_marks * 100) if attempt.assessment.total_marks > 0 else 70.0
    is_passed = percentage >= passing_percentage

    # Lock attempt
    now = datetime.utcnow()
    attempt.status = AttemptStatus.SUBMITTED.value
    attempt.submitted_at = now
    attempt.score = total_score
    attempt.total_marks = total_possible_marks
    attempt.passed = is_passed

    await db.commit()

    trainee_view = await get_proctored_assessment_trainee_view(db, attempt.assessment_id, user_id)
    total_q = len(attempt.assessment.questions)

    return {
        "attempt_id": attempt.id,
        "assessment_id": attempt.assessment_id,
        "test_name": trainee_view["test_name"],
        "course": trainee_view["course"],
        "day": trainee_view["day"],
        "topic": trainee_view["topic"],
        "score": total_score,
        "total_marks": total_possible_marks,
        "percentage": percentage,
        "answered_count": answered_count,
        "unanswered_count": total_q - answered_count,
        "passed": is_passed,
        "status": attempt.status,
        "submitted_at": now
    }
