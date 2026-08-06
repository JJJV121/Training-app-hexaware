from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.admin_user import AdminUserUpdate


async def get_users_by_role(
    db: AsyncSession,
    role: str,
):
    result = await db.execute(
        select(User)
        .where(User.role == role)
        .order_by(User.name)
    )

    return result.scalars().all()


async def get_user_by_id_and_role(
    db: AsyncSession,
    user_id: int,
    role: str,
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.role == role,
        )
    )

    return result.scalar_one_or_none()


async def update_user(
    db: AsyncSession,
    user_id: int,
    role: str,
    data: AdminUserUpdate,
):
    user = await get_user_by_id_and_role(
        db,
        user_id,
        role,
    )

    if not user:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return user


async def delete_user(
    db: AsyncSession,
    user_id: int,
    role: str,
):
    user = await get_user_by_id_and_role(
        db,
        user_id,
        role,
    )

    if not user:
        return False

    await db.delete(user)
    await db.commit()

    return True


async def search_users(
    db: AsyncSession,
    role: str,
    keyword: str,
):
    result = await db.execute(
        select(User).where(
            User.role == role,
            or_(
                User.name.ilike(f"%{keyword}%"),
                User.email.ilike(f"%{keyword}%"),
                User.employee_id.ilike(f"%{keyword}%"),
            ),
        )
    )

    return result.scalars().all()


async def filter_users(
    db: AsyncSession,
    role: str,
    course_id: int | None = None,
    is_active: bool | None = None,
):
    filters = [User.role == role]

    if course_id is not None:
        filters.append(User.course_id == course_id)

    if is_active is not None:
        filters.append(User.is_active == is_active)

    result = await db.execute(
        select(User)
        .where(and_(*filters))
        .order_by(User.name)
    )

    return result.scalars().all()


async def update_user_status(
    db: AsyncSession,
    user_id: int,
    role: str,
    is_active: bool,
):
    user = await get_user_by_id_and_role(
        db,
        user_id,
        role,
    )

    if not user:
        return None

    user.is_active = is_active

    await db.commit()
    await db.refresh(user)

    return user