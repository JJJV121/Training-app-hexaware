from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class LearningUnit(Base):
    __tablename__ = "learning_units"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    day_id: Mapped[int] = mapped_column(
        ForeignKey("course_days.id"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(1000),
        nullable=True
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer
    )

