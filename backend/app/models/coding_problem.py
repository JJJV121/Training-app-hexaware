from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.database.base import Base


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    assignment_id: Mapped[int | None] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=True
    )

    assessment_id: Mapped[int | None] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    language_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    marks: Mapped[int | None] = mapped_column(
        Integer,
        default=50
    )

    sample_input: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    sample_output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    deadline: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    difficulty: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    starter_code: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    constraints: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    language: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )