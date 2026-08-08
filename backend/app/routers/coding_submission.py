from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.coding_submission import (
    CodingSubmissionCreate
)

from app.services.coding_submission_service import (
    create_submission,
    get_submission,
    get_attempt_submissions
)

router = APIRouter(
    prefix="/submissions",
    tags=["Coding Submissions"]
)

@router.post("/")
async def submit_code(
    request: CodingSubmissionCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await create_submission(
            db,
            request
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    

@router.get("/{submission_id}")
async def get_single_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_submission(
            db,
            submission_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
@router.get("/attempt/{attempt_id}")
async def get_submissions(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_attempt_submissions(
        db,
        attempt_id
    )

