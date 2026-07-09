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
    assessment: MCQAssessment
):

    generated_questions = []
    topic_distribution = assessment.topic_distribution
    for topic, question_count in topic_distribution.items():
        result = await db.scalars(
            select(MCQQuestion)
            .where(
                MCQQuestion.topic == topic,
                MCQQuestion.is_active == True
            )
        )

        questions = result.all()
        if len(questions) < question_count:
            raise ValueError(
                f"Not enough questions available for {topic}"
            )
        selected_questions = random.sample(
            questions,
            question_count
        )
        for question in selected_questions:
            generated_questions.append(
                {
                    "id": question.id,
                    "question_text": question.question_text,
                    "option_a": question.option_a,
                    "option_b": question.option_b,
                    "option_c": question.option_c,
                    "option_d": question.option_d,
                    "marks": question.marks
                }
            )
    random.shuffle(
        generated_questions
    )
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

    answers = attempt.answers or {}

    correct_answers = 0
    total_marks = 0
    obtained_marks = 0

    for question in attempt.generated_questions:

        question_obj = await db.scalar(
            select(MCQQuestion).where(
                MCQQuestion.id == question["id"]
            )
        )

        if not question_obj:
            continue

        total_marks += question_obj.marks

        selected_option = answers.get(
            str(question_obj.id)
        )

        if (
            selected_option ==
            question_obj.correct_option
        ):
            correct_answers += 1
            obtained_marks += question_obj.marks

    percentage = 0

    if total_marks > 0:
        percentage = round(
            (obtained_marks / total_marks) * 100,
            2
        )

    assessment = await db.scalar(
        select(MCQAssessment).where(
            MCQAssessment.id ==
            attempt.assessment_id
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
        result=result
    )

    db.add(report)

    await db.commit()
    await db.refresh(report)

    return {
        "score": obtained_marks,
        "percentage": percentage,
        "result": result
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