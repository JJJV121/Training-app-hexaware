from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    notification_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    channel: Mapped[str] = mapped_column(
        String(50),
        default="IN_APP",
        nullable=False
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="MEDIUM",
        nullable=False
    )

    reference_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )

    reference_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationship
    user = relationship("User")
