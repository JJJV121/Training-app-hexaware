from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AssignmentType(PyEnum):
    NON_CODING = "NON_CODING"
    CASE_STUDY = "CASE_STUDY"
    PROJECT = "PROJECT"
    CODING = "CODING"


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    course_day_id: Mapped[int] = mapped_column(
        ForeignKey("course_days.id"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    assignment_type: Mapped[AssignmentType] = mapped_column(
    Enum(AssignmentType, name="assignment_type"),
    nullable=False
)

    instructions: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    attachment_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        default=100,
        nullable=False
    )

    passing_marks: Mapped[int] = mapped_column(
        Integer,
        default=75,
        nullable=False
    )

    due_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )