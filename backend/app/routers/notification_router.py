from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
)

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.get("")
async def get_notifications_api(
    unread_only: bool = Query(False),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notifications for the logged-in user.
    """
    notifications = await get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
    )
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "notification_type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "channel": n.channel,
            "priority": n.priority,
            "reference_type": n.reference_type,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "sent_at": n.sent_at.isoformat() if n.sent_at else None,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.patch("/{notification_id}/read")
async def mark_single_notification_read_api(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a specific notification as read.
    """
    success = await mark_notification_read(db, notification_id=notification_id, user_id=current_user.id)
    return {"status": "success" if success else "not_found", "id": notification_id}


@router.patch("/read-all")
async def mark_all_notifications_read_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications as read for current user.
    """
    count = await mark_all_notifications_read(db, user_id=current_user.id)
    return {"status": "success", "updated_count": count}
