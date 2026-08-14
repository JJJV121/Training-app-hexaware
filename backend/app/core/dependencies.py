from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.security import verify_access_token
from app.models.user import User
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


async def get_current_user(
     credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):

    try:
        token = credentials.credentials
        payload = verify_access_token(token)
        user_id = int(payload["sub"])

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = await db.scalar(
        select(User).where(User.id == user_id)
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


async def get_current_trainer(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.role or current_user.role.upper() != "TRAINER":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Trainer role required."
        )
    return current_user


async def get_current_trainer_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.role or current_user.role.upper() not in ["TRAINER", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Trainer or Admin role required."
        )
    return current_user