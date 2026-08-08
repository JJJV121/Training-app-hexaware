from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.dashboard import (
    DashboardResponse
)

from app.services.dashboard_service import (
    get_dashboard
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/{user_id}",
    response_model=DashboardResponse
)
async def dashboard(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    return await get_dashboard(
        db,
        user_id
    )