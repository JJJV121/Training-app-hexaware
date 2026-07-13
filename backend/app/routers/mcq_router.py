from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.mcq_schemas import (
    QuestionCreate,
    QuestionUpdate,
    AssessmentCreate,
    AssessmentUpdate,
    StartAttemptRequest,
    AutoSaveRequest,
    SubmitAttemptRequest
)

from app.services.mcq_question_service import *
from app.services.mcq_assessment_service import *
from app.services.mcq_attempt_service import *

router = APIRouter(
    prefix="/mcq",
    tags=["MCQ Assessment"]
)

# ==========================================================
# QUESTION BANK
# ==========================================================

@router.post("/questions")
async def create_question_api(
    question: QuestionCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await create_question(db, question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/questions")
async def get_questions_api(
    topic: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db)
):

    if topic or difficulty or search:
        return await search_filter_questions(
            db,
            topic,
            difficulty,
            search
        )

    return await get_all_questions(db)


@router.get("/questions/{question_id}")
async def get_question_api(
    question_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_question_by_id(
            db,
            question_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put("/questions/{question_id}")
async def update_question_api(
    question_id: int,
    question: QuestionUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_question(
            db,
            question_id,
            question
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.delete("/questions/{question_id}")
async def delete_question_api(
    question_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await delete_question(
            db,
            question_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# ASSESSMENT
# ==========================================================

@router.post("/assessments")
async def create_assessment_api(
    assessment: AssessmentCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await create_assessment(
            db,
            assessment
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/assessments")
async def get_assessments_api(
    db: AsyncSession = Depends(get_db)
):
    return await get_all_assessments(db)


# ==========================================================
# AVAILABLE ASSESSMENTS
# ==========================================================

@router.get("/assessments/available")
async def available_assessments_api(
    db: AsyncSession = Depends(get_db)
):
    return await get_available_assessments(db)


# ==========================================================
# UPDATE ASSESSMENT
# ==========================================================

@router.put("/assessments/{assessment_id}")
async def update_assessment_api(
    assessment_id: int,
    assessment: AssessmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_assessment(
            db,
            assessment_id,
            assessment
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# DELETE ASSESSMENT
# ==========================================================

@router.delete("/assessments/{assessment_id}")
async def delete_assessment_api(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await delete_assessment(
            db,
            assessment_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# PUBLISH ASSESSMENT
# ==========================================================

@router.post("/assessments/{assessment_id}/publish")
async def publish_assessment_api(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await publish_assessment(
            db,
            assessment_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# GET ASSESSMENT BY ID
# KEEP THIS LAST
# ==========================================================

@router.get("/assessments/{assessment_id}")
async def get_assessment_api(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_assessment_by_id(
            db,
            assessment_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

# ==========================================================
# ATTEMPTS
# ==========================================================

@router.post("/attempts/start")
async def start_attempt_api(
    request: StartAttemptRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await start_attempt(
            db,
            request
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/attempts/current/{trainee_id}")
async def current_attempt_api(
    trainee_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_current_attempt(db,trainee_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.get("/attempts/{attempt_id}")
async def get_attempt_api(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_attempt_by_id(
            db,
            attempt_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
# ==========================================================
# AUTO SAVE
# ==========================================================

@router.post("/attempts/{attempt_id}/autosave")
async def autosave_attempt_api(
    attempt_id: int,
    data: AutoSaveRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await autosave_attempt(
            db,
            attempt_id,
            data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# SUBMIT ATTEMPT
# ==========================================================

@router.post("/attempts/{attempt_id}/submit")
async def submit_attempt_api(
    attempt_id: int,
    data: SubmitAttemptRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await submit_attempt(
            db,
            attempt_id,
            data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==========================================================
# RESULTS
# ==========================================================

@router.get("/results/{attempt_id}")
async def get_result_api(
    attempt_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_result(
            db,
            attempt_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# ==========================================================
# REPORTS
# ==========================================================

@router.get("/reports/trainer")
async def trainer_report_api(
    db: AsyncSession = Depends(get_db)
):
    return await get_trainer_report(db)


@router.get("/reports/admin")
async def admin_report_api(
    db: AsyncSession = Depends(get_db)
):
    return await get_admin_report(db)


@router.get("/reports/assessment/{assessment_id}")
async def assessment_report_api(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_assessment_report(
        db,
        assessment_id
    )
