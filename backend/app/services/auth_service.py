from datetime import datetime, timedelta
from uuid import uuid4
import uuid

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.login_history import LoginHistory
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.models.user import User
from app.models.activation_token import ActivationToken
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user import UserCreate
from app.services.email_service import (
    send_activation_email,
    send_reset_email,
)


async def create_user(
    db: AsyncSession,
    user_data: UserCreate,
) -> User:

    existing_user = await db.scalar(
        select(User).where(
            User.email == user_data.email
        )
    )

    if existing_user:
        raise ValueError(
            "User with this email already exists"
        )

    role = user_data.role.lower()

    if role in ["trainer", "admin"] and not user_data.password:
        raise ValueError(
            "Password is required for trainer/admin"
        )

    user = User(
        employee_id=user_data.employee_id,
        name=user_data.name,
        email=user_data.email,
        course_id=user_data.course_id,
        role=user_data.role,
<<<<<<< HEAD
        is_active=user_data.role in ["trainer", "admin"],
=======
        is_active=(
            role in ["trainer", "admin"]
        ),
>>>>>>> feature/backend/admin-batch-management
    )

    if role in ["trainer", "admin"]:
        user.password_hash = hash_password(
            user_data.password
        )

    db.add(user)

    await db.commit()
    await db.refresh(user)

<<<<<<< HEAD
    # Trainees need account activation
    if user.role == "trainee":
=======
    if role == "trainee":
>>>>>>> feature/backend/admin-batch-management
        token_obj = await generate_activation_token(
            db,
            user.id,
        )

        activation_link = (
            f"http://localhost:5173/create-password"
            f"?token={token_obj.token}"
        )

        await send_activation_email(
            user.email,
            activation_link,
        )

    return user


async def generate_activation_token(
    db: AsyncSession,
    user_id: int,
) -> ActivationToken:

    activation_token = ActivationToken(
        user_id=user_id,
        token=str(uuid4()),
        expires_at=datetime.utcnow() + timedelta(days=1),
        is_used=False,
    )

    db.add(activation_token)

    await db.commit()
    await db.refresh(activation_token)

    return activation_token


async def activate_account(
    db: AsyncSession,
    token: str,
    password: str,
):

<<<<<<< HEAD
    # 1. Get token
=======
>>>>>>> feature/backend/admin-batch-management
    activation_token = await db.scalar(
        select(ActivationToken).where(
            ActivationToken.token == token
        )
    )

    if not activation_token:
        raise ValueError("Invalid token")

<<<<<<< HEAD
    # 2. Expiry check
    if activation_token.expires_at < datetime.utcnow():
        raise ValueError("Token expired")

    # 3. Already used check
    if activation_token.is_used:
        raise ValueError("Token already used")

    # 4. Get user
    user = await db.get(
        User,
        activation_token.user_id
=======
    if activation_token.expires_at < datetime.utcnow():
        raise ValueError("Token expired")

    if activation_token.is_used:
        raise ValueError("Token already used")

    user = await db.get(
        User,
        activation_token.user_id,
>>>>>>> feature/backend/admin-batch-management
    )

    if not user:
        raise ValueError("User not found")

<<<<<<< HEAD
    # 5. Update user
    user.password_hash = hash_password(password)
    user.is_active = True

    # 6. Mark token as used
=======
    user.password_hash = hash_password(password)
    user.is_active = True

>>>>>>> feature/backend/admin-batch-management
    activation_token.is_used = True

    await db.commit()

    return user


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
<<<<<<< HEAD
    request: Request
=======
    request: Request,
>>>>>>> feature/backend/admin-batch-management
):

    user = await db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if not user:
        raise ValueError("Invalid credentials")

    if not user.is_active:
        raise ValueError("Account not activated")

<<<<<<< HEAD
    # 3. Verify password
    if not verify_password(
        password,
        user.password_hash
=======
    if not verify_password(
        password,
        user.password_hash,
>>>>>>> feature/backend/admin-batch-management
    ):
        raise ValueError("Invalid credentials")

    token = create_access_token(
        data={"sub": str(user.id)}
    )

<<<<<<< HEAD
    # 5. Extract system information
=======
>>>>>>> feature/backend/admin-batch-management
    ip_address = (
        request.client.host
        if request.client
        else None
    )

    user_agent = request.headers.get(
        "user-agent"
    )

    login_entry = LoginHistory(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(login_entry)

    await db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "employee_id": user.employee_id,
            "name": user.name,
            "role": user.role,
        },
    }


async def forgot_password(
    db: AsyncSession,
<<<<<<< HEAD
    email: str
):

    # 1. Find user
=======
    email: str,
):

>>>>>>> feature/backend/admin-batch-management
    user = await db.scalar(
        select(User).where(
            User.email == email
        )
    )

<<<<<<< HEAD
    # 2. Security:
    # Don't reveal whether the user exists
=======
>>>>>>> feature/backend/admin-batch-management
    if not user:
        return {
            "message": "If user exists, reset link sent"
        }

    reset_token = str(uuid.uuid4())

<<<<<<< HEAD
    # 4. Set expiry
=======
>>>>>>> feature/backend/admin-batch-management
    expiry_time = (
        datetime.utcnow()
        + timedelta(minutes=15)
    )

    token_entry = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expiry_time,
        is_used=False,
    )

    db.add(token_entry)

    await db.commit()
    await db.refresh(token_entry)

<<<<<<< HEAD
    # 6. Create reset link
    reset_link = (
        f"http://localhost:5173/reset-password"
        f"?token={reset_token}"
    )

    # 7. Send email
    await send_reset_email(
        user.email,
        reset_link
=======
    reset_link = (
        f"http://localhost:5173/reset-password?token={reset_token}"
    )

    await send_reset_email(
        user.email,
        reset_link,
>>>>>>> feature/backend/admin-batch-management
    )

    return {
        "message": "If user exists, reset link sent"
    }


async def reset_password(
    db: AsyncSession,
    token: str,
    new_password: str,
):

    reset_entry = await db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token
        )
    )

    if not reset_entry:
        raise ValueError("Invalid token")

<<<<<<< HEAD
    # 2. Already used check
    if reset_entry.is_used:
        raise ValueError("Token already used")

    # 3. Expiry check
=======
    if reset_entry.is_used:
        raise ValueError("Token already used")

>>>>>>> feature/backend/admin-batch-management
    if reset_entry.expires_at < datetime.utcnow():
        raise ValueError("Token expired")

    user = await db.scalar(
        select(User).where(
            User.id == reset_entry.user_id
        )
    )

    if not user:
        raise ValueError("User not found")

<<<<<<< HEAD
    # 5. Update password
=======
>>>>>>> feature/backend/admin-batch-management
    user.password_hash = hash_password(
        new_password
    )

    reset_entry.is_used = True

    await db.commit()

    return {
        "message": "Password reset successful"
<<<<<<< HEAD
    }


async def request_activation(
    db: AsyncSession,
    email: str
):

    # 1. Find user
    user = await db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if not user:
        raise ValueError("User not found")

    if user.is_active:
        raise ValueError("User already activated")

    # 2. Generate token
    token_obj = await generate_activation_token(
        db,
        user.id
    )

    # 3. Create activation link
    activation_link = (
        f"http://localhost:5173/create-password"
        f"?token={token_obj.token}"
    )

    # 4. Send email
    await send_activation_email(
        user.email,
        activation_link
    )

    return {
        "message": "Activation email sent"
=======
>>>>>>> feature/backend/admin-batch-management
    }