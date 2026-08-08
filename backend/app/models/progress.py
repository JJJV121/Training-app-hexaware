from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    learning_unit_id: Mapped[int] = mapped_column(
        ForeignKey("learning_units.id"),
        nullable=False
    )

    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

