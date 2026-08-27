from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import verify_password, hash_password


from app.core.password_validation import validate_full_password_policy, record_password_change


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

    # 3. Validate new_password against full password policy (including last 6 passwords history check)
    await validate_full_password_policy(
        db,
        new_password,
        user_id=user.id,
        current_password_hash=user.password_hash,
    )

    # 4. Update password & record history
    old_hash = user.password_hash
    user.password_hash = hash_password(new_password)
    await record_password_change(db, user, old_hash)

    # 5. Commit changes
    await db.commit()

    return {
        "message": "Password changed successfully"
    }