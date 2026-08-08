from datetime import datetime

from sqlalchemy import DateTime, Integer, String,Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    duration_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    thumbnail_url: Mapped[str] = mapped_column(
        String(1000)
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

   