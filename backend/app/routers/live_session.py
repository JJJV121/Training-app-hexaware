from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User

from app.database.session import get_db

from app.schemas.live_session import (
    LiveSessionCreate,
    LiveSessionUpdate,
    LiveSessionResponse,
)

from app.services.live_session_service import (
    create_live_session,
    get_live_sessions,
    get_live_session_by_id,
    update_live_session,
    delete_live_session,
    get_upcoming_sessions,
)


router = APIRouter(
    prefix="/api/trainer/sessions",
    tags=["Trainer Live Sessions"],
)


async def get_trainer_id(db: AsyncSession) -> int:
    result = await db.execute(
        select(User.id).where(func.lower(User.role) == "trainer").order_by(User.id)
    )
    trainer_id = result.scalar()
    return trainer_id or 1


# --------------------------------------------------
# Create Live Session
# --------------------------------------------------

@router.post(
    "",
    response_model=LiveSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_live_session_api(
    data: LiveSessionCreate,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await create_live_session(
        db=db,
        trainer_id=trainer_id,
        data=data,
    )


# --------------------------------------------------
# Get All Live Sessions
# --------------------------------------------------

@router.get(
    "",
    response_model=list[LiveSessionResponse],
)
async def get_live_sessions_api(
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await get_live_sessions(
        db=db,
        trainer_id=trainer_id,
    )


# --------------------------------------------------
# Get Upcoming Live Sessions
# --------------------------------------------------

@router.get(
    "/upcoming",
    response_model=list[LiveSessionResponse],
)
async def get_upcoming_sessions_api(
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await get_upcoming_sessions(
        db=db,
        trainer_id=trainer_id,
    )


# --------------------------------------------------
# Get Live Session By ID
# --------------------------------------------------

@router.get(
    "/{session_id}",
    response_model=LiveSessionResponse,
)
async def get_live_session_api(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await get_live_session_by_id(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )


# --------------------------------------------------
# Update Live Session
# --------------------------------------------------

@router.put(
    "/{session_id}",
    response_model=LiveSessionResponse,
)
async def update_live_session_api(
    session_id: int,
    data: LiveSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await update_live_session(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
        data=data,
    )


# --------------------------------------------------
# Delete Live Session
# --------------------------------------------------

@router.delete(
    "/{session_id}",
)
async def delete_live_session_api(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer_id = await get_trainer_id(db)

    return await delete_live_session(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )