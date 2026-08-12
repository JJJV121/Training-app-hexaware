from app.core.dependencies import get_current_user,require_trainee
from app.models.user import User

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_trainee)
):
    try:
        
        submission = await run_submission(
            db=db,
            problem_id=payload.problem_id,
            user_id=current_user.id,
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_trainee)
):
    
    result = await db.execute(
        select(CodingSubmission).where(
            CodingSubmission.user_id == current_user.id
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    # Trainee can only view their own submission
    if current_user.role == "trainee":
        if submission.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own submission"
            )

    # Trainer/Admin can view submissions
    elif current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this submission"
        )

    return submission