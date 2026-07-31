from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean

from app.database.base import Base


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "coding_problems.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    source_code: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # Judge0 language ID
    language_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    judge0_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # PENDING / ACCEPTED / WRONG_ANSWER /
    # RUNTIME_ERROR / COMPILATION_ERROR
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING"
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    is_passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    # Optional but useful for results
    passed_testcases: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_testcases: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )