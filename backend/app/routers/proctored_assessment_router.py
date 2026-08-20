from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.assessment import (
    ProctoredAssessmentTraineeResponse,
    CreateAttemptRequest,
    AttemptResponse,
    SaveAnswerRequest,
    ProctoringEventRequest,
    SubmitAttemptResponse,
)
from app.services.proctored_assessment_service import (
    get_or_create_day_assessment,
    get_proctored_assessment_trainee_view,
    create_or_get_active_attempt,
    save_answer,
    record_proctoring_event,
    submit_attempt,
)

router = APIRouter(tags=["Proctored Assessment"])


@router.get("/assessments/by-day/{course_day_id}/proctored", response_model=ProctoredAssessmentTraineeResponse)
async def get_assessment_by_day(
    course_day_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get or dynamically initialize proctored assessment for a given course day.
    Returns trainee-safe details with zero answer key leakage.
    Format: course_day_topic (e.g. Python_Day_03_Functions)
    """
    assessment = await get_or_create_day_assessment(db, course_day_id)
    trainee_data = await get_proctored_assessment_trainee_view(db, assessment.id, current_user.id)
    return trainee_data


@router.get("/assessments/{assessment_id}/proctored", response_model=ProctoredAssessmentTraineeResponse)
async def get_assessment_proctored(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get trainee-safe proctored assessment. Excludes all correct answer indicators.
    """
    trainee_data = await get_proctored_assessment_trainee_view(db, assessment_id, current_user.id)
    return trainee_data


@router.post("/assessments/{assessment_id}/attempts", response_model=AttemptResponse)
async def start_assessment_attempt(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new assessment attempt or retrieve active attempt for trainee.
    Enforces server-side expiration and restoration on refresh.
    """
    attempt_data = await create_or_get_active_attempt(db, assessment_id, current_user.id)
    return attempt_data


@router.get("/assessment-attempts/{attempt_id}", response_model=AttemptResponse)
async def get_attempt_state(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve current state of an attempt to restore on browser refresh.
    """
    from sqlalchemy import select
    from app.models.assessment import AssessmentAttempt
    stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()
    if not attempt or attempt.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    attempt_data = await create_or_get_active_attempt(db, attempt.assessment_id, current_user.id)
    return attempt_data


@router.put("/assessment-attempts/{attempt_id}/answers/{question_id}")
async def save_attempt_answer(
    attempt_id: int,
    question_id: int,
    payload: SaveAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Auto-saves candidate answers dynamically. Rejects requests for finished or expired attempts.
    """
    return await save_answer(
        db=db,
        attempt_id=attempt_id,
        question_id=question_id,
        user_id=current_user.id,
        selected_option_ids=payload.selected_option_ids,
        answer_text=payload.answer_text,
        current_question_index=payload.current_question_index
    )


@router.post("/assessment-attempts/{attempt_id}/proctoring-events")
async def log_proctoring_event(
    attempt_id: int,
    payload: ProctoringEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records proctoring events such as TAB_SWITCH, FULLSCREEN_EXIT, etc.
    """
    return await record_proctoring_event(
        db=db,
        attempt_id=attempt_id,
        user_id=current_user.id,
        event_type=payload.event_type,
        timestamp=payload.timestamp,
        metadata_json=payload.metadata
    )


@router.post("/assessment-attempts/{attempt_id}/submit", response_model=SubmitAttemptResponse)
async def submit_assessment_attempt(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits attempt, evaluates answers server-side, and locks attempt.
    """
    return await submit_attempt(db, attempt_id, current_user.id)
