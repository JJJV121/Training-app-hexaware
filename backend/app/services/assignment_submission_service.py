from datetime import datetime,timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.assignment_submission import (
    AssignmentSubmission,
    SubmissionStatus,
)
from app.models.assignment import Assignment, AssignmentType
from app.schemas.assignment_submission import AssignmentEvaluation
from app.services.assignment_unlock_service import is_assignment_unlocked

async def submit_assignment(
    db: AsyncSession,
    assignment_id: int,
    user_id: int,
    submission_text: str | None,
    github_url: str | None,
    submission_path: str | None,
):
    # Check assignment exists
    result = await db.execute(
        select(Assignment).where(
            Assignment.id == assignment_id
        )
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )
    current_time = datetime.now(timezone.utc)

    if assignment.due_date:
        assignment_due = assignment.due_date

        if assignment_due.tzinfo is None:
            assignment_due = assignment_due.replace(tzinfo=timezone.utc)

        if current_time > assignment_due:
            raise HTTPException(
                status_code=400,
                detail="Assignment submission deadline has passed."
            )
        
    # Prevent duplicate submission
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.user_id == user_id,
        )
    )

    existing_submission = result.scalar_one_or_none()

    if existing_submission:
        raise HTTPException(
            status_code=400,
            detail="Assignment already submitted."
        )

    # Validate submission based on assignment type

    if assignment.assignment_type == AssignmentType.NON_CODING:
        if not submission_path:
            raise HTTPException(
                status_code=400,
                detail="PDF submission is required for Non-Coding Assignment."
            )

    elif assignment.assignment_type == AssignmentType.CASE_STUDY:
        if not github_url:
            raise HTTPException(
                status_code=400,
                detail="GitHub URL is required for Case Study."
            )

    elif assignment.assignment_type == AssignmentType.PROJECT:
        if not github_url:
            raise HTTPException(
                status_code=400,
                detail="GitHub URL is required for Project."
            )
        
    is_unlocked = await is_assignment_unlocked(
    db=db,
    assignment=assignment,
    user_id=user_id,
)

    if not is_unlocked:
        raise HTTPException(
        status_code=403,
        detail="Assignment is locked."
    )

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=user_id,
        submission_text=submission_text,
        github_url=github_url,
        submission_path=submission_path,
        status=SubmissionStatus.SUBMITTED,
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return submission

async def evaluate_submission(
    db: AsyncSession,
    submission: AssignmentSubmission,
    trainer_id: int,
    data: AssignmentEvaluation,
):
    submission.marks = data.marks
    submission.feedback = data.feedback
    submission.status = SubmissionStatus.EVALUATED
    submission.evaluated_by = trainer_id
    submission.evaluated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(submission)

    return submission


async def get_submission_by_id(
    db: AsyncSession,
    submission_id: int,
):
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.id == submission_id
        )
    )

    return result.scalar_one_or_none()


async def get_user_submissions(
    db: AsyncSession,
    user_id: int,
):
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.user_id == user_id
        )
    )

    return result.scalars().all()

async def get_assignment_submissions(
    db: AsyncSession,
    assignment_id: int,
):
    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id
        )
    )

    return result.scalars().all()