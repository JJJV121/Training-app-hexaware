from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class CourseDayQA(Base):
    __tablename__ = "course_day_qas"

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

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    answer: Mapped[str | None] = mapped_column(
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
