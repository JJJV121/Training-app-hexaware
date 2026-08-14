from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

from app.database.session import get_db
from app.core.dependencies import get_current_trainer
from app.services.trainer_analytics_service import (
    get_module_analytics,
    get_analytics_alerts
)

router = APIRouter(
    prefix="/api/trainer/analytics",
    tags=["Trainer Analytics"]
)


@router.get("/modules")
async def modules_analytics(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_trainer: User = Depends(get_current_trainer),
):
    return await get_module_analytics(
        db=db,
        batch_id=batch_id
    )


@router.get("/alerts")
async def analytics_alerts(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_trainer: User = Depends(get_current_trainer),
):
    return await get_analytics_alerts(
        db=db,
        batch_id=batch_id
    )