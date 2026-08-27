from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.database.base import Base


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey("coding_problems.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    source_code: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    language_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    judge0_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    score: Mapped[int | None] = mapped_column(
        Integer,
        default=0
    )

    is_passed: Mapped[bool | None] = mapped_column(
        Boolean,
        default=False
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    passed_testcases: Mapped[int | None] = mapped_column(
        Integer,
        default=0
    )

    total_testcases: Mapped[int | None] = mapped_column(
        Integer,
        default=0
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )