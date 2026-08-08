from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.assessment import (
    AssessmentCreate
)

from app.services.assessment_service import (
    create_assessment,
    get_assessment,
    get_all_assessments,
    publish_assessment,
    delete_assessment
)

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"]
)

@router.post("/")
async def create(
    request: AssessmentCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_assessment(
        db,
        request
    )

@router.get("/")
async def get_all(
    db: AsyncSession = Depends(get_db)
):
    return await get_all_assessments(
        db
    )

@router.get("/{assessment_id}")
async def get_one(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_assessment(
            db,
            assessment_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.post(
    "/{assessment_id}/publish"
)
async def publish(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await publish_assessment(
        db,
        assessment_id
    )

@router.delete(
    "/{assessment_id}"
)
async def delete(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await delete_assessment(
        db,
        assessment_id
    )