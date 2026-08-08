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
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    language: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    starter_code: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    sample_input: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    sample_output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    constraints: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )