import re
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.models.password_history import PasswordHistory
from app.models.user import User


SPECIAL_CHAR_REGEX = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]")


def validate_password_syntax(password: str) -> None:
    """
    Validates password against rules 1-4:
    1. Upper case (A, B...)
    2. Lower case (a, b...)
    3. Numerals (1, 2,...) & Special characters (@, *, ....)
    4. Minimum 12 characters
    """
    errors = []

    if len(password) < 12:
        errors.append("Must be minimum 12 characters long.")

    if not re.search(r"[A-Z]", password):
        errors.append("Must contain at least one uppercase letter (A-Z).")

    if not re.search(r"[a-z]", password):
        errors.append("Must contain at least one lowercase letter (a-z).")

    if not re.search(r"[0-9]", password):
        errors.append("Must contain at least one numeral (0-9).")

    if not SPECIAL_CHAR_REGEX.search(password):
        errors.append("Must contain at least one special character (@, *, !, #, etc.).")

    if errors:
        raise ValueError("Password policy violation: " + " ".join(errors))


async def check_password_reuse(
    db: AsyncSession,
    user_id: int,
    current_password_hash: str | None,
    new_password: str,
) -> None:
    """
    Enforces rule 6: Last 6 passwords, not to be re-used.
    Checks new_password against current_password_hash and up to 5 previous entries in PasswordHistory.
    """
    # 1. Check current password
    if current_password_hash and verify_password(new_password, current_password_hash):
        raise ValueError("Password cannot be one of your last 6 passwords.")

    # 2. Check previous entries in PasswordHistory (up to 5 past hashes, total 6 with current)
    result = await db.execute(
        select(PasswordHistory)
        .where(PasswordHistory.user_id == user_id)
        .order_by(PasswordHistory.created_at.desc())
        .limit(5)
    )
    history_entries = result.scalars().all()

    for entry in history_entries:
        if verify_password(new_password, entry.password_hash):
            raise ValueError("Password cannot be one of your last 6 passwords.")


async def record_password_change(
    db: AsyncSession,
    user: User,
    old_password_hash: str | None,
) -> None:
    """
    Updates user.password_changed_at to current timestamp.
    If old_password_hash exists, adds it to PasswordHistory so it counts towards the last 6 passwords.
    """
    user.password_changed_at = datetime.utcnow()

    if old_password_hash:
        history_entry = PasswordHistory(
            user_id=user.id,
            password_hash=old_password_hash,
            created_at=datetime.utcnow(),
        )
        db.add(history_entry)


async def validate_full_password_policy(
    db: AsyncSession,
    new_password: str,
    user_id: int | None = None,
    current_password_hash: str | None = None,
) -> None:
    """
    Runs full password policy validation: syntax check and reuse check (if user_id provided).
    """
    validate_password_syntax(new_password)

    if user_id is not None:
        await check_password_reuse(db, user_id, current_password_hash, new_password)
