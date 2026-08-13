from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Text,
    Float,
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
        primary_key=True
    )

    """attempt_id: Mapped[int] = mapped_column(
        ForeignKey(
            "assessment_attempts.id",
            ondelete="CASCADE"
        )
    )"""
    attempt_id: Mapped[int] = mapped_column(Integer)

    coding_problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "coding_problems.id",
            ondelete="CASCADE"
        )
    )

    source_code: Mapped[str] = mapped_column(
        Text
    )

    language: Mapped[str] = mapped_column(
        String(20)
    )

    stdout: Mapped[str | None] = mapped_column(
        Text
    )

    stderr: Mapped[str | None] = mapped_column(
        Text
    )


    passed_testcases: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_testcases: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0
    )



    ai_feedback: Mapped[str | None] = mapped_column(
        Text
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )