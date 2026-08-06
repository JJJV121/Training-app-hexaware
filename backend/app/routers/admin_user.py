from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.admin_user import (
    AdminUserResponse,
    AdminUserUpdate,
    UserStatusUpdate,
)
from app.services.admin_user_service import (
    get_users_by_role,
    get_user_by_id_and_role,
    update_user,
    delete_user,
    search_users,
    filter_users,
    update_user_status,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin User Management"],
)

# ==================================================
# Trainer Management
# ==================================================

@router.get(
    "/trainers",
    response_model=list[AdminUserResponse],
    status_code=status.HTTP_200_OK,
)
async def view_all_trainers(
    db: AsyncSession = Depends(get_db),
):
    return await get_users_by_role(db, "Trainer")


@router.get(
    "/trainers/{trainer_id}",
    response_model=AdminUserResponse,
    status_code=status.HTTP_200_OK,
)
async def view_trainer_profile(
    trainer_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainer = await get_user_by_id_and_role(
        db,
        trainer_id,
        "Trainer",
    )

    if not trainer:
        raise HTTPException(
            status_code=404,
            detail="Trainer not found",
        )

    return trainer


@router.put(
    "/trainers/{trainer_id}",
    response_model=AdminUserResponse,
)
async def edit_trainer(
    trainer_id: int,
    trainer: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user(
        db,
        trainer_id,
        "Trainer",
        trainer,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Trainer not found",
        )

    return updated


@router.delete(
    "/trainers/{trainer_id}",
)
async def remove_trainer(
    trainer_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_user(
        db,
        trainer_id,
        "Trainer",
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Trainer not found",
        )

    return {
        "message": "Trainer deleted successfully"
    }


@router.get(
    "/trainers/search",
    response_model=list[AdminUserResponse],
)
async def search_trainers(
    keyword: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await search_users(
        db,
        "Trainer",
        keyword,
    )


@router.get(
    "/trainers/filter",
    response_model=list[AdminUserResponse],
)
async def filter_trainers(
    course_id: int | None = Query(None),
    is_active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await filter_users(
        db,
        "Trainer",
        course_id,
        is_active,
    )


# ==================================================
# Trainee Management
# ==================================================

@router.get(
    "/trainees",
    response_model=list[AdminUserResponse],
)
async def view_all_trainees(
    db: AsyncSession = Depends(get_db),
):
    return await get_users_by_role(
        db,
        "Trainee",
    )


@router.get(
    "/trainees/{trainee_id}",
    response_model=AdminUserResponse,
)
async def view_trainee_profile(
    trainee_id: int,
    db: AsyncSession = Depends(get_db),
):
    trainee = await get_user_by_id_and_role(
        db,
        trainee_id,
        "Trainee",
    )

    if not trainee:
        raise HTTPException(
            status_code=404,
            detail="Trainee not found",
        )

    return trainee


@router.put(
    "/trainees/{trainee_id}",
    response_model=AdminUserResponse,
)
async def edit_trainee(
    trainee_id: int,
    trainee: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user(
        db,
        trainee_id,
        "Trainee",
        trainee,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Trainee not found",
        )

    return updated


@router.delete(
    "/trainees/{trainee_id}",
)
async def remove_trainee(
    trainee_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_user(
        db,
        trainee_id,
        "Trainee",
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Trainee not found",
        )

    return {
        "message": "Trainee deleted successfully"
    }


@router.patch(
    "/trainees/{trainee_id}/status",
    response_model=AdminUserResponse,
)
async def change_trainee_status(
    trainee_id: int,
    status_data: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    trainee = await update_user_status(
        db,
        trainee_id,
        "Trainee",
        status_data.is_active,
    )

    if not trainee:
        raise HTTPException(
            status_code=404,
            detail="Trainee not found",
        )

    return trainee


@router.get(
    "/trainees/search",
    response_model=list[AdminUserResponse],
)
async def search_trainees(
    keyword: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await search_users(
        db,
        "Trainee",
        keyword,
    )


@router.get(
    "/trainees/filter",
    response_model=list[AdminUserResponse],
)
async def filter_trainees(
    course_id: int | None = Query(None),
    is_active: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await filter_users(
        db,
        "Trainee",
        course_id,
        is_active,
    )