from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.database.base import Base


class Assessment(Base):

    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey(
            "courses.id",
            ondelete="CASCADE"
        )
    )

    day_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "course_days.id",
            ondelete="SET NULL"
        )
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        default=100
    )

    pass_percentage: Mapped[int] = mapped_column(
        Integer,
        default=50
    )

    start_time: Mapped[datetime | None] = mapped_column(
        DateTime
    )

    end_time: Mapped[datetime | None] = mapped_column(
        DateTime
    )

    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )