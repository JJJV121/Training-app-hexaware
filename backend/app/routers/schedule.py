from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.schedule import (
    ScheduleResponse
)

from app.services.schedule_service import (
    get_user_schedule
)

router = APIRouter(
    prefix="/schedule",
    tags=["Schedule"]
)


@router.get(
    "/{user_id}",
    response_model=ScheduleResponse
)
async def get_schedule(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await get_user_schedule(
            db,
            user_id
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
