import random
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcq_models import (
    MCQAssessment,
    MCQAttempt,
    MCQQuestion,
)

from app.schemas.mcq_schemas import (
    StartAttemptRequest,
)


# ==========================================================
# START ATTEMPT
# ==========================================================

async def start_attempt(
    db: AsyncSession,
    request: StartAttemptRequest
):
    assessment = await db.scalar(
        select(MCQAssessment).where(
            MCQAssessment.id == request.assessment_id
        )
    )
    if not assessment:
        raise ValueError(
            "Assessment not found"
        )
    if assessment.status != "Published":
        raise ValueError(
            "Assessment is not published"
        )
    existing_attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.assessment_id == request.assessment_id,
            MCQAttempt.trainee_id == request.trainee_id
        )
    )
    if existing_attempt:
        raise ValueError(
            "Assessment already attempted"
        )

    generated_questions = await generate_random_questions(
        db,
        assessment
    )
    attempt = MCQAttempt(
        assessment_id=request.assessment_id,
        trainee_id=request.trainee_id,
        generated_questions=generated_questions,
        answers={},
        remaining_seconds=
        assessment.duration_minutes * 60,
        status="IN_PROGRESS"
    )

    db.add(attempt)

    await db.commit()
    await db.refresh(attempt)

    return attempt


# ==========================================================
# RANDOM QUESTION GENERATION
# ==========================================================

async def generate_random_questions(
    db: AsyncSession,
    assessment: MCQAssessment,
):
    topic_distribution = assessment.topic_distribution or {}

    if not topic_distribution:
        return []

    topics = list(topic_distribution.keys())

    result = await db.scalars(
        select(MCQQuestion)
        .where(
            MCQQuestion.topic.in_(topics),
            MCQQuestion.is_active.is_(True),
        )
    )

    questions = result.all()

    questions_by_topic = {}

    for question in questions:
        questions_by_topic.setdefault(
            question.topic,
            []
        ).append(question)

    generated_questions = []

    for topic, required_count in topic_distribution.items():

        available_questions = questions_by_topic.get(topic, [])

        if len(available_questions) < required_count:
            raise ValueError(
                f"Not enough questions available for {topic}"
            )

        selected_questions = random.sample(
            available_questions,
            required_count,
        )

        generated_questions.extend(
            {
                "id": question.id,
                "question_text": question.question_text,
                "option_a": question.option_a,
                "option_b": question.option_b,
                "option_c": question.option_c,
                "option_d": question.option_d,
                "marks": question.marks,
            }
            for question in selected_questions
        )

    random.shuffle(generated_questions)

    return generated_questions


# ==========================================================
# CURRENT ATTEMPT
# ==========================================================

async def get_current_attempt(
    db: AsyncSession,
    trainee_id: int
):
    attempt = await db.scalar(
        select(MCQAttempt)
        .where(
            MCQAttempt.trainee_id == trainee_id,
            MCQAttempt.status == "IN_PROGRESS"
        )
    )
    if not attempt:
        raise ValueError(
            "No active assessment"
        )
    return attempt


# ==========================================================
# GET ATTEMPT BY ID
# ==========================================================

async def get_attempt_by_id(
    db: AsyncSession,
    attempt_id: int
):
    attempt = await db.scalar(
        select(MCQAttempt)
        .where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    return attempt

from app.schemas.mcq_schemas import (
    AutoSaveRequest,
    SubmitAttemptRequest
)

# ==========================================================
# RESUME ATTEMPT
# ==========================================================

async def resume_attempt(
    db: AsyncSession,
    trainee_id: int
):

    attempt = await db.scalar(

        select(MCQAttempt).where(
            MCQAttempt.trainee_id == trainee_id,
            MCQAttempt.status == "IN_PROGRESS"
        )

    )

    if not attempt:
        raise ValueError(
            "No active assessment found"
        )

    return attempt


# ==========================================================
# AUTO SAVE
# ==========================================================

async def autosave_attempt(
    db: AsyncSession,
    attempt_id: int,
    autosave_data: AutoSaveRequest
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    if attempt.status != "IN_PROGRESS":
        raise ValueError(
            "Assessment already submitted"
        )
    attempt.answers = autosave_data.answers
    attempt.remaining_seconds = autosave_data.remaining_seconds
    await db.commit()
    await db.refresh(attempt)
    return {
        "message": "Progress saved successfully"
    }


# ==========================================================
# SUBMIT ATTEMPT
# ==========================================================

async def submit_attempt(
    db: AsyncSession,
    attempt_id: int,
    submission: SubmitAttemptRequest
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    if attempt.status == "SUBMITTED":
        raise ValueError(
            "Assessment already submitted"
        )
    attempt.answers = submission.answers
    attempt.status = "SUBMITTED"
    attempt.remaining_seconds = 0
    attempt.submitted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(attempt)

    result = await evaluate_attempt(
        db,
        attempt.id
    )

    return result


# ==========================================================
# AUTO SUBMIT
# ==========================================================

async def auto_submit_attempt(
    db: AsyncSession,
    attempt_id: int
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    if attempt.status == "SUBMITTED":
        return attempt
    attempt.status = "SUBMITTED"
    attempt.remaining_seconds = 0
    attempt.submitted_at = datetime.utcnow()
    await db.commit()
    return await evaluate_attempt(
        db,
        attempt.id
    )


# ==========================================================
# TIMER UPDATE
# ==========================================================

async def update_timer(
    db: AsyncSession,
    attempt_id: int,
    remaining_seconds: int
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    attempt.remaining_seconds = remaining_seconds
    await db.commit()
    return {
        "remaining_seconds": remaining_seconds
    }

from app.models.mcq_models import (
    MCQReport
)

# ==========================================================
# EVALUATE ATTEMPT
# ==========================================================

async def evaluate_attempt(
    db: AsyncSession,
    attempt_id: int,
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )

    if not attempt:
        raise ValueError("Attempt not found")
    existing_report = await db.scalar(
    select(MCQReport).where(
        MCQReport.assessment_id == attempt.assessment_id,
        MCQReport.trainee_id == attempt.trainee_id,
    )
    )

    if existing_report:
        return {
            "score": existing_report.score,
            "percentage": float(existing_report.percentage),
            "result": existing_report.result,
        }
    
    answers = attempt.answers or {}
    generated_questions = attempt.generated_questions or []

    question_ids = [
        question["id"]
        for question in generated_questions
    ]

    if not question_ids:
        raise ValueError("No questions found for this attempt")

    question_result = await db.scalars(
        select(MCQQuestion).where(
            MCQQuestion.id.in_(question_ids)
        )
    )

    question_map = {
        question.id: question
        for question in question_result.all()
    }

    correct_answers = 0
    total_marks = 0
    obtained_marks = 0

    for question_data in generated_questions:

        question = question_map.get(
            question_data["id"]
        )

        if question is None:
            continue

        total_marks += question.marks

        selected_option = answers.get(
            str(question.id)
        )

        if selected_option == question.correct_option:
            correct_answers += 1
            obtained_marks += question.marks

    percentage = (
        round((obtained_marks / total_marks) * 100, 2)
        if total_marks > 0
        else 0
    )

    assessment = await db.scalar(
        select(MCQAssessment).where(
            MCQAssessment.id == attempt.assessment_id
        )
    )

    result = (
        "PASS"
        if percentage >= assessment.pass_percentage
        else "FAIL"
    )

    attempt.score = obtained_marks
    attempt.percentage = percentage
    attempt.result = result

    report = MCQReport(
        assessment_id=attempt.assessment_id,
        trainee_id=attempt.trainee_id,
        score=obtained_marks,
        percentage=percentage,
        result=result,
    )

    db.add(report)

    await db.commit()

    await db.refresh(report)

    return {
        "score": obtained_marks,
        "percentage": percentage,
        "result": result,
    }


# ==========================================================
# GET RESULT
# ==========================================================

async def get_result(
    db: AsyncSession,
    attempt_id: int
):
    attempt = await db.scalar(
        select(MCQAttempt).where(
            MCQAttempt.id == attempt_id
        )
    )
    if not attempt:
        raise ValueError(
            "Attempt not found"
        )
    if attempt.result is None:
        raise ValueError(
            "Assessment not evaluated yet"
        )
    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "percentage": attempt.percentage,
        "result": attempt.result,
        "submitted_at": attempt.submitted_at
    }


# ==========================================================
# TRAINER REPORT
# ==========================================================

async def get_trainer_report(
    db: AsyncSession
):

    result = await db.scalars(
        select(MCQReport)
        .order_by(
            MCQReport.completed_at.desc()
        )
    )

    return result.all()


# ==========================================================
# ADMIN REPORT
# ==========================================================

async def get_admin_report(
    db: AsyncSession
):
    result = await db.scalars(
        select(MCQReport)
        .order_by(
            MCQReport.completed_at.desc()
        )
    )
    return result.all()

# ==========================================================
# ASSESSMENT REPORT
# ==========================================================
async def get_assessment_report(
    db: AsyncSession,
    assessment_id: int
):
    result = await db.scalars(
        select(MCQReport)
        .where(
            MCQReport.assessment_id == assessment_id
        )
        .order_by(
            MCQReport.completed_at.desc()
        )
    )

    return result.all()