from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CandidateIssue(Base):
    __tablename__ = "candidate_issues"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    issue_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    issue_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="MEDIUM",
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="OPEN",
        nullable=False,
        index=True
    )

    admin_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    assigned_to_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    escalated_to_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    resolved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    candidate = relationship("User", foreign_keys=[candidate_id])
    assigned_to_user = relationship("User", foreign_keys=[assigned_to_user_id])
    resolved_by_user = relationship("User", foreign_keys=[resolved_by])
    batch = relationship("Batch")
