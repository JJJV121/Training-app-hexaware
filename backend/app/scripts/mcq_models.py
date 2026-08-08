from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    DECIMAL,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


# ============================================================
# MCQ QUESTION BANK
# ============================================================

class MCQQuestion(Base):
    __tablename__ = "mcq_questions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    option_a: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    option_b: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    option_c: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    option_d: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    correct_option: Mapped[str] = mapped_column(
        String(1),
        nullable=False
    )

    topic: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    marks: Mapped[int] = mapped_column(
        Integer,
        default=1
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
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


# ============================================================
# MCQ ASSESSMENT
# ============================================================

class MCQAssessment(Base):
    __tablename__ = "mcq_assessments"

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
        Text,
        nullable=True
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    pass_percentage: Mapped[int] = mapped_column(
        Integer,
        default=40
    )

    unlock_after_days: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Draft"
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
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

    topic_distribution: Mapped[dict] = mapped_column(
        JSON,
        nullable=False
    )


# ============================================================
# MCQ ATTEMPTS
# ============================================================

class MCQAttempt(Base):
    __tablename__ = "mcq_attempts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("mcq_assessments.id"),
        nullable=False
    )

    trainee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    generated_questions: Mapped[dict] = mapped_column(
        JSON,
        nullable=False
    )

    answers: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    remaining_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="IN_PROGRESS"
    )

    score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    percentage: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True
    )

    result: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )


# ============================================================
# MCQ REPORTS
# ============================================================

class MCQReport(Base):
    __tablename__ = "mcq_reports"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("mcq_assessments.id"),
        nullable=False
    )

    trainee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    percentage: Mapped[float] = mapped_column(
        DECIMAL(5, 2),
        nullable=False
    )

    result: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )