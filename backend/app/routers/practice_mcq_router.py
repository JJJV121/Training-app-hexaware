from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.practice_mcq_service import get_topic_practice_mcqs

router = APIRouter(
    prefix="/practice",
    tags=["Practice MCQ"]
)

@router.get("/units/{unit_id}/mcqs")
@router.get("/courses/{course_id}/units/{unit_id}/mcqs")
async def get_unit_practice_mcqs(
    unit_id: int,
    course_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves 25 randomized practice MCQs for a specific topic / learning unit.
    Randomizes question order and option choices while preserving correct answer evaluation.
    """
    result = await get_topic_practice_mcqs(db, unit_id=unit_id)
    return result

@router.get("/topics/{topic_name}/mcqs")
async def get_topic_name_practice_mcqs(
    topic_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves 25 randomized practice MCQs by topic name.
    """
    result = await get_topic_practice_mcqs(db, topic_name=topic_name)
    return result
