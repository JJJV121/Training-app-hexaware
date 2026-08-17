from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


# ============================================================
# BATCH MANAGEMENT
# ============================================================

class Batch(Base):
    __tablename__ = "batches"

    # ========================================================
    # Primary Key
    # ========================================================

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # Batch Details
    # ========================================================

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
    )

    trainer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    college_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # ========================================================
    # Schedule
    # ========================================================

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    start_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    end_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    # ========================================================
    # Capacity
    # ========================================================

    max_strength: Mapped[int] = mapped_column(
        Integer,
        default=30,
        nullable=False,
    )

    # ========================================================
    # Status
    # ========================================================

    status: Mapped[str] = mapped_column(
        String(20),
        default="UPCOMING",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ========================================================
    # Audit
    # ========================================================

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# ============================================================
# BATCH TRAINEE MAPPING
# ============================================================

class BatchTrainee(Base):
    __tablename__ = "batch_trainees"

    # ========================================================
    # Primary Key
    # ========================================================

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # Mapping
    # ========================================================

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"),
        nullable=False,
    )

    trainee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    # ========================================================
    # Metadata
    # ========================================================

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
    )