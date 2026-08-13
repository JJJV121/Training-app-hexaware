from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.coding_submission import CodingSubmission

from app.schemas.coding_submission_schema import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionResultResponse
)

from app.services.submission_service import run_submission


router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"]
)


# --------------------------------------------------
# Create Submission
# --------------------------------------------------
@router.post(
    "/",
    response_model=SubmissionResultResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_submission(
    payload: SubmissionCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Mock trainee until authentication is merged
        trainee_id = 3
        submission = await run_submission(
            db=db,
            problem_id=payload.problem_id,
            user_id=trainee_id,
            source_code=payload.source_code,
            language_id=payload.language_id
        )

        return submission

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# --------------------------------------------------
# Get My Submissions
# --------------------------------------------------
@router.get(
    "/me",
    response_model=list[SubmissionResponse]
)
async def get_my_submissions(
    db: AsyncSession = Depends(get_db)
):
    trainee_id = 3
    result = await db.execute(
        select(CodingSubmission).where(
            CodingSubmission.user_id == trainee_id
        )
    )

    return result.scalars().all()


# --------------------------------------------------
# Get Submission By ID
# --------------------------------------------------
@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse
)
async def get_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db)
):
    submission = await db.scalar(
        select(CodingSubmission).where(
            CodingSubmission.id == submission_id
        )
    )

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    return submission


# --------------------------------------------------
# Get Submissions By Problem ID
# --------------------------------------------------
@router.get(
    "/problem/{problem_id}",
    response_model=list[SubmissionResponse]
)
async def get_submissions_by_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CodingSubmission).where(
            CodingSubmission.problem_id == problem_id
        )
    )
    return result.scalars().all()