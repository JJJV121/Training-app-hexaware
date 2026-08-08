from sqlalchemy import select

from app.models.assessment_attempt import AssessmentAttempt
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

async def start_attempt(
    db,
    assessment_id: int,
    user_id: int
):

    existing = await db.scalar(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.assessment_id
            == assessment_id,

            AssessmentAttempt.user_id
            == user_id
        )
    )

    if existing:
        return existing

    attempt = AssessmentAttempt(
        assessment_id=assessment_id,
        user_id=user_id,
        status="started"
    )

    db.add(attempt)

    await db.commit()

    await db.refresh(attempt)

    return attempt


async def get_attempt(
    db,
    attempt_id: int
):
    attempt = await db.scalar(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.id == attempt_id
        )
    )

    if not attempt:
        raise ValueError(
            "Attempt not found"
        )

    return attempt


async def finish_attempt(
    db,
    attempt_id: int
):

    attempt = await db.get(
        AssessmentAttempt,
        attempt_id
    )

    if not attempt:
        raise ValueError(
            "Attempt not found"
        )

    attempt.submitted_at = datetime.utcnow()

    attempt.status = "submitted"

    await db.commit()

    return attempt


async def get_attempt_result(
    db,
    attempt_id: int
):
    attempt = await db.scalar(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.id == attempt_id
        )
    )

    if not attempt:
        raise ValueError(
            "Attempt not found"
        )

    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "status": attempt.status,
        "submitted_at": attempt.submitted_at
    }



async def report_violation(
    db: AsyncSession,
    attempt_id: int,
    violation_type: str
):

    attempt = await db.scalar(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.id == attempt_id
        )
    )

    if not attempt:
        raise ValueError(
            "Assessment attempt not found"
        )

    if attempt.is_terminated:
        return {
            "terminated": True,
            "message": "Assessment already terminated."
        }

    attempt.violation_count += 1

    if attempt.violation_count >= 3:

        attempt.status = "terminated"

        attempt.is_terminated = True

        attempt.termination_reason = violation_type

        attempt.submitted_at = datetime.utcnow()

    await db.commit()

    return {
        "violations": attempt.violation_count,
        "remaining": max(0, 3 - attempt.violation_count),
        "terminated": attempt.is_terminated,
        "message":
            "Assessment terminated."
            if attempt.is_terminated
            else "Violation recorded."
    }