from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

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
)


router = APIRouter(
    prefix="/trainer/live-sessions",
    tags=["Trainer Live Sessions"],
)


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
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

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
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await get_live_sessions(
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
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await get_live_session_by_id(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )


# --------------------------------------------------
# Update Live Session
# --------------------------------------------------

@router.patch(
    "/{session_id}",
    response_model=LiveSessionResponse,
)
async def update_live_session_api(
    session_id: int,
    data: LiveSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

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
    # TODO: Replace with authenticated trainer after auth integration
    trainer_id = 1

    return await delete_live_session(
        db=db,
        trainer_id=trainer_id,
        session_id=session_id,
    )