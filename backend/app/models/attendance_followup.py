from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class FollowupStage(str, PyEnum):
    ACTIVE = "ACTIVE"
    REMINDER_1_SENT = "REMINDER_1_SENT"
    REMINDER_2_SENT = "REMINDER_2_SENT"
    WARNING_SENT = "WARNING_SENT"
    REASON_SUBMITTED = "REASON_SUBMITTED"
    REASON_APPROVED = "REASON_APPROVED"
    REASON_REJECTED = "REASON_REJECTED"
    DISCONTINUED = "DISCONTINUED"
    CLOSED = "CLOSED"


class AttendanceFollowupRecord(Base):
    __tablename__ = "attendance_followup_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"),
        nullable=False,
        index=True
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
        index=True
    )

    current_stage: Mapped[str] = mapped_column(
        String(50),
        default=FollowupStage.ACTIVE.value,
        nullable=False,
        index=True
    )

    consecutive_absence_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    first_absence_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    latest_absence_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    reminder_1_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    reminder_2_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    warning_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    reason_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    reason_category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    reason_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    reason_attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    spoc_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    spoc_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    spoc_decision: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    spoc_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    discontinued_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    cr_notified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class AttendanceFollowupAuditLog(Base):
    __tablename__ = "attendance_followup_audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    followup_record_id: Mapped[int] = mapped_column(
        ForeignKey("attendance_followup_records.id"),
        nullable=False,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    actor_role: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    metadata_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )

    value: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
