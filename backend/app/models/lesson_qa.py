from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class LessonQA(Base):
    __tablename__ = "lesson_qa"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    learning_unit_id: Mapped[int] = mapped_column(
        ForeignKey("learning_units.id"),
        nullable=False
    )

    question: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    answer: Mapped[str] = mapped_column(
        String(5000),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )