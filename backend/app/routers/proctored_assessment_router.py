from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.assessment import AssessmentQuestion
from app.schemas.assessment import (
    ProctoredAssessmentTraineeResponse,
    CreateAttemptRequest,
    AttemptResponse,
    SaveAnswerRequest,
    RunCodeRequest,
    RunCodeResponse,
    ProctoringEventRequest,
    SubmitAttemptRequest,
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
from app.services.code_execution_service import execute_code_against_testcases

router = APIRouter(tags=["Proctored Assessment"])


@router.get("/assessments/by-day/{course_day_id}/proctored", response_model=ProctoredAssessmentTraineeResponse)
async def get_assessment_by_day(
    course_day_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Get or dynamically initialize proctored coding assessment for a given course day.
    Returns title format: course_day_topic (e.g. Python_Day_3_Palindromes)
    """
    assessment = await get_or_create_day_assessment(db, course_day_id)
    trainee_data = await get_proctored_assessment_trainee_view(db, assessment.id, current_user.id)
    return trainee_data


@router.get("/assessments/{assessment_id}/proctored", response_model=ProctoredAssessmentTraineeResponse)
@router.get("/assessment/{assessment_id}", response_model=ProctoredAssessmentTraineeResponse)
async def get_assessment_proctored(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Get trainee-safe assessment details. Excludes answer key leakage.
    """
    trainee_data = await get_proctored_assessment_trainee_view(db, assessment_id, current_user.id)
    return trainee_data


@router.post("/assessments/{assessment_id}/attempts", response_model=AttemptResponse)
@router.post("/assessment/{assessment_id}/start", response_model=AttemptResponse)
async def start_assessment_attempt(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Create a new assessment attempt or retrieve active attempt for trainee.
    """
    attempt_data = await create_or_get_active_attempt(db, assessment_id, current_user.id)
    return attempt_data


@router.get("/assessment-attempts/{attempt_id}", response_model=AttemptResponse)
async def get_attempt_state(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Retrieve current state of an attempt to restore on browser refresh.
    """
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
    current_user: User = Depends(get_optional_user)
):
    """
    Auto-saves candidate answers (MCQ or Coding) dynamically.
    """
    return await save_answer(
        db=db,
        attempt_id=attempt_id,
        question_id=question_id,
        user_id=current_user.id,
        selected_option_ids=payload.selected_option_ids,
        answer_text=payload.answer_text,
        code=payload.code,
        language=payload.language,
        current_question_index=payload.current_question_index
    )


@router.post("/assessment/run-code", response_model=RunCodeResponse)
@router.post("/assessments/run-code", response_model=RunCodeResponse)
async def run_assessment_code(
    payload: RunCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Executes trainee code against problem test cases using isolated sandbox.
    Does NOT return expected answers for hidden test cases.
    """
    q_stmt = select(AssessmentQuestion).where(AssessmentQuestion.id == payload.question_id)
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    test_cases = question.test_cases or []
    eval_result = await execute_code_against_testcases(
        code=payload.code,
        language=payload.language,
        test_cases=test_cases
    )
    return eval_result


@router.post("/assessment-attempts/{attempt_id}/proctoring-events")
async def log_proctoring_event(
    attempt_id: int,
    payload: ProctoringEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
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


@router.post("/assessments/{assessment_id}/submit", response_model=SubmitAttemptResponse)
@router.post("/assessment-attempts/{attempt_id}/submit", response_model=SubmitAttemptResponse)
async def submit_assessment_attempt(
    attempt_id: int = None,
    assessment_id: int = None,
    payload: SubmitAttemptRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Submits attempt, evaluates all answers server-side, and locks attempt.
    """
    target_attempt_id = attempt_id

    if not target_attempt_id and assessment_id:
        from app.models.assessment import AssessmentAttempt, AttemptStatus
        stmt = (
            select(AssessmentAttempt)
            .where(
                AssessmentAttempt.assessment_id == assessment_id,
                AssessmentAttempt.user_id == current_user.id,
                AssessmentAttempt.status == AttemptStatus.IN_PROGRESS.value
            )
        )
        res = await db.execute(stmt)
        active_att = res.scalar_one_or_none()
        if active_att:
            target_attempt_id = active_att.id

    if not target_attempt_id:
        raise HTTPException(status_code=404, detail="Active assessment attempt not found.")

    # Save answers if provided in payload
    if payload and payload.answers:
        for item in payload.answers:
            await save_answer(
                db=db,
                attempt_id=target_attempt_id,
                question_id=item.question_id,
                user_id=current_user.id,
                selected_option_ids=item.selected_option_ids,
                answer_text=item.answer_text,
                code=item.code,
                language=item.language
            )

    return await submit_attempt(db, target_attempt_id, current_user.id)
