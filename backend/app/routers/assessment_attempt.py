from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db


from app.schemas.assessment_attempt import (
    AssessmentAttemptCreate,
    ViolationRequest

)

from app.services.assessment_attempt_service import (
    start_attempt,
    finish_attempt,
    get_attempt,
    get_attempt_result,
    report_violation
)

router = APIRouter(
    prefix="/attempts",
    tags=["Assessment Attempts"]
)

@router.post("/start")
async def start(
    request: AssessmentAttemptCreate,
    db: AsyncSession = Depends(get_db)
):
    return await start_attempt(
        db,
        request.assessment_id,
        request.user_id
    )

@router.post(
    "/{attempt_id}/finish"
)
async def finish(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await finish_attempt(
        db,
        attempt_id
    )

@router.get(
    "/{attempt_id}"
)
async def get(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_attempt(
        db,
        attempt_id
    )


@router.get(
    "/{attempt_id}/result"
)
async def result(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_attempt_result(
        db,
        attempt_id
    )


@router.post("/{attempt_id}/violation")
async def violation(
    attempt_id: int,
    request: ViolationRequest,
    db: AsyncSession = Depends(get_db)
):
    return await report_violation(
        db,
        attempt_id,
        request.violation_type
    )