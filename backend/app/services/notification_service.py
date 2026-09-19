from datetime import datetime
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_mail import MessageSchema

from app.models.notification import Notification
from app.models.user import User
from app.core.mail import fastmail

logger = logging.getLogger(__name__)


async def send_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    channel: str = "ALL",
    priority: str = "MEDIUM",
    reference_type: str | None = None,
    reference_id: int | None = None,
    email_recipient: str | None = None,
    email_subject: str | None = None,
    email_body_html: str | None = None,
) -> Notification:
    """
    Centralized Notification Service.
    Handles both IN_APP notifications and EMAIL alerts.
    Includes duplication protection (Requirement 11).
    """

    # 1. Duplication Protection Check
    if reference_type and reference_id:
        dup_stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.notification_type == notification_type,
            Notification.reference_type == reference_type,
            Notification.reference_id == reference_id,
        )
        res = await db.execute(dup_stmt)
        existing = res.scalar_one_or_none()
        if existing:
            logger.info(
                f"[NOTIFICATION] Duplicate prevented for user={user_id}, type={notification_type}, "
                f"ref={reference_type}:{reference_id}"
            )
            return existing

    # 2. Fetch User email if email_recipient not explicitly passed
    recipient_email = email_recipient
    if not recipient_email and channel in ["EMAIL", "ALL"]:
        user_stmt = select(User).where(User.id == user_id)
        user_res = await db.execute(user_stmt)
        user_obj = user_res.scalar_one_or_none()
        if user_obj:
            recipient_email = user_obj.email

    # 3. Create Notification DB Record
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        channel=channel,
        priority=priority,
        reference_type=reference_type,
        reference_id=reference_id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notification)
    await db.flush()

    # 4. Email Dispatch Logic
    if channel in ["EMAIL", "ALL"] and recipient_email:
        subj = email_subject or f"[Hexaware LMS] {title}"
        body_content = email_body_html or f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h3 style="color: #0f172a; margin-top: 0;">{title}</h3>
              <p style="font-size: 15px; line-height: 1.6;">{message}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">This is an automated notification from Hexaware Training Management System.</p>
            </div>
          </body>
        </html>
        """
        try:
            msg = MessageSchema(
                subject=subj,
                recipients=[recipient_email],
                body=body_content,
                subtype="html",
            )
            await fastmail.send_message(msg)
            notification.sent_at = datetime.utcnow()
            logger.info(
                f"[EMAIL SUCCESS] Sent '{subj}' to {recipient_email} (Ref ID: {reference_id})"
            )
        except Exception as e:
            # Failure logging (Requirement 14) - non-blocking transaction failure
            logger.error(
                f"[EMAIL FAILURE] Failed to send email to {recipient_email} for user {user_id}. "
                f"Error: {e} | Type: {notification_type} | Ref: {reference_type}:{reference_id}"
            )

    await db.commit()
    await db.refresh(notification)
    return notification


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def mark_notification_read(
    db: AsyncSession,
    notification_id: int,
    user_id: int,
) -> bool:
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount > 0


async def mark_all_notifications_read(
    db: AsyncSession,
    user_id: int,
) -> int:
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount
