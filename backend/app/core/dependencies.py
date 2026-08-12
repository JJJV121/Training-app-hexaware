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



# =========================================================
# Admin Role
# =========================================================

async def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# =========================================================
# Trainer Role
# =========================================================

async def require_trainer(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=403,
            detail="Trainer access required"
        )

    return current_user


# =========================================================
# Trainee Role
# =========================================================

async def require_trainee(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "trainee":
        raise HTTPException(
            status_code=403,
            detail="Trainee access required"
        )

    return current_user