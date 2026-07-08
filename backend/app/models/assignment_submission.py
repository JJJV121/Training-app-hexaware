from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class SubmissionStatus(PyEnum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"
    LATE = "LATE"


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    submission_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    submission_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    github_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus),
        default=SubmissionStatus.PENDING,
        nullable=False
    )

    marks: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    evaluated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    evaluated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )