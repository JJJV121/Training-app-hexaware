from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_trainer, get_current_trainer_or_admin

from app.schemas.live_session import (
    LiveSessionCreate,
    LiveSessionUpdate,
    LiveSessionResponse,
)

from app.services.live_session_service import (
    create_live_session,
    get_live_sessions,
    get_all_live_sessions,
    get_live_session_by_id,
    update_live_session,
    delete_live_session,
    get_upcoming_sessions,
)


router = APIRouter(
    prefix="/api/trainer/sessions",
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
    current_user: User = Depends(get_current_trainer_or_admin),
):
    trainer_id = data.trainer_id if current_user.role.upper() == "ADMIN" else current_user.id
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
    current_user: User = Depends(get_current_trainer_or_admin),
):
    if current_user.role.upper() == "ADMIN":
        return await get_all_live_sessions(db)
    else:
        return await get_live_sessions(db, current_user.id)


# --------------------------------------------------
# Get All Live Sessions (Explicit All route)
# --------------------------------------------------

@router.get(
    "/all",
    response_model=list[LiveSessionResponse],
)
async def get_all_live_sessions_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_trainer_or_admin),
):
    return await get_all_live_sessions(db)


# --------------------------------------------------
# Get Upcoming Live Sessions
# --------------------------------------------------

@router.get(
    "/upcoming",
    response_model=list[LiveSessionResponse],
)
async def get_upcoming_sessions_api(
    db: AsyncSession = Depends(get_db),
    current_trainer: User = Depends(get_current_trainer),
):
    return await get_upcoming_sessions(
        db=db,
        trainer_id=current_trainer.id,
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
    current_user: User = Depends(get_current_trainer_or_admin),
):
    trainer_id = None if current_user.role.upper() == "ADMIN" else current_user.id
    return await get_live_session_by_id(
        db=db,
        session_id=session_id,
        trainer_id=trainer_id,
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
    current_user: User = Depends(get_current_trainer_or_admin),
):
    trainer_id = None if current_user.role.upper() == "ADMIN" else current_user.id
    return await update_live_session(
        db=db,
        session_id=session_id,
        data=data,
        trainer_id=trainer_id,
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
    current_user: User = Depends(get_current_trainer_or_admin),
):
    trainer_id = None if current_user.role.upper() == "ADMIN" else current_user.id
    return await delete_live_session(
        db=db,
        session_id=session_id,
        trainer_id=trainer_id,
    )