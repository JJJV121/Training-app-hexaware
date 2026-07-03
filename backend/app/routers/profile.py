from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.profile import ChangePasswordRequest, ProfileResponse
from app.services.profile_service import change_password, get_profile


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get(
    "/{user_id}",
    response_model=ProfileResponse
)
async def profile(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    try:
        return await get_profile(
            db,
            user_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )   


@router.post(
    "/{user_id}/change-password"
)
async def change_password_api(
    user_id: int,
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db)
):

    try:
        return await change_password(
            db,
            user_id,
            data.current_password,
            data.new_password
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )