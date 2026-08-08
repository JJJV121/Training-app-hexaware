from datetime import datetime, timedelta
from uuid import uuid4
import uuid
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.login_history import LoginHistory
from app.core.security import hash_password,verify_password, create_access_token
from app.models.user import User
from app.models.activation_token import ActivationToken
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user import UserCreate
from app.services.email_service import send_activation_email, send_reset_email



async def create_user(
    db: AsyncSession,
    user_data: UserCreate
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

    user = User(
        employee_id=user_data.employee_id,
        email=user_data.email,
        is_active=False
    )

    db.add(user)

    await db.commit()
    await db.refresh(user)

    return user


async def generate_activation_token(
    db: AsyncSession,
    user_id: int
) -> ActivationToken:

    activation_token = ActivationToken(
        user_id=user_id,
        token=str(uuid4()),
        expires_at=datetime.utcnow() + timedelta(days=1),
        is_used=False
    )

    db.add(activation_token)

    await db.commit()
    await db.refresh(activation_token)

    return activation_token




async def activate_account(
    db: AsyncSession,
    token: str,
    password: str
):
    

    # 1. get token
    activation_token = await db.scalar(
        select(ActivationToken).where(
            ActivationToken.token == token
        )
    )

    if not activation_token:
        raise ValueError("Invalid token")

    # 2. expiry check
    if activation_token.expires_at < datetime.utcnow():
        raise ValueError("Token expired")

    # 3. already used check
    if activation_token.is_used:
        raise ValueError("Token already used")

    # 4. get user
    user = await db.get(User, activation_token.user_id)

    if not user:
        raise ValueError("User not found")

    # 5. update user
    user.password_hash = hash_password(password)
    user.is_active = True

    # 6. mark token used
    activation_token.is_used = True

    await db.commit()

    return user



async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
    request: Request   # required to extract system info
):

    # 1. Get user
    user = await db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        raise ValueError("Invalid credentials")

    # 2. Check activation
    if not user.is_active:
        raise ValueError("Account not activated")

    # 3. Verify password
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")

    # 4. Create JWT token
    token = create_access_token(
        data={"sub": str(user.id)}
    )

    # 5. Extract system data (AUTO - NOT FROM USER)
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # 6. Store login history
    login_entry = LoginHistory(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent
    )

    db.add(login_entry)
    await db.commit()

    # 7. Return response
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "employee_id": user.employee_id
        }
    }



async def forgot_password(db: AsyncSession, email: str):

    # 1. Find user
    user = await db.scalar(
        select(User).where(User.email == email)
    )

    # 2. Security: don't reveal if user exists
    if not user:
        return {"message": "If user exists, reset link sent"}

    # 3. Generate secure reset token
    reset_token = str(uuid.uuid4())

    # 4. Set expiry (15 minutes recommended)
    expiry_time = datetime.utcnow() + timedelta(minutes=15)

    # 5. Store token in DB
    token_entry = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expiry_time,
        is_used=False
    )

    db.add(token_entry)
    await db.commit()
    await db.refresh(token_entry)

    # 6. Create reset link (frontend will handle this)
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    # 7. TEMP: print instead of email (we’ll integrate fastapi-mail later)
    await send_reset_email(user.email, reset_link)

    return {"message": "If user exists, reset link sent"}



async def reset_password(
    db: AsyncSession,
    token: str,
    new_password: str
):

    # 1. Find token
    reset_entry = await db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token
        )
    )

    if not reset_entry:
        raise ValueError("Invalid token")

    # 2. Check if already used
    if reset_entry.is_used:
        raise ValueError("Token already used")

    # 3. Check expiry
    if reset_entry.expires_at < datetime.utcnow():
        raise ValueError("Token expired")

    # 4. Get user
    user = await db.scalar(
        select(User).where(User.id == reset_entry.user_id)
    )

    if not user:
        raise ValueError("User not found")

    # 5. Update password
    user.password_hash = hash_password(new_password)

    # 6. Mark token as used
    reset_entry.is_used = True

    # 7. Commit changes
    await db.commit()

    return {"message": "Password reset successful"}


async def request_activation(db, email: str):

    # 1. find user
    user = await db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        raise ValueError("User not found")

    if user.is_active:
        raise ValueError("User already activated")

    # 2. generate token
    token_obj = await generate_activation_token(db, user.id)

    # 3. create link
    activation_link = f"http://localhost:3000/create-password?token={token_obj.token}"

    # 4. send email (Mailtrap later)
    await send_activation_email(user.email, activation_link)

    return {"message": "Activation email sent"}