from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class CaseStudy(Base):
    __tablename__ = "case_studies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    course_day_id: Mapped[int] = mapped_column(
        ForeignKey("course_days.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    scenario: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    requirements: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    total_marks: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    due_date: Mapped[datetime | None] = mapped_column(
        DateTime,
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
