from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import verify_password, hash_password


async def get_profile(
    db: AsyncSession,
    user_id: int
):

    user = await db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError(
            "User not found"
        )

    return user

async def change_password(
    db: AsyncSession,
    user_id: int,
    current_password: str,
    new_password: str
):

    # 1. Get user
    user = await db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if not user:
        raise ValueError("User not found")

    # 2. Verify current password
    if not verify_password(
        current_password,
        user.password_hash
    ):
        raise ValueError("Current password is incorrect")

    # 3. Update password
    user.password_hash = hash_password(new_password)

    # 4. Commit changes
    await db.commit()

    return {
        "message": "Password changed successfully"
    }