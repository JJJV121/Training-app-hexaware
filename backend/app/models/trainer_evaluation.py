from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TrainerEvaluation(Base):
    __tablename__ = "trainer_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trainer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    trainee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Quantitative Ratings (1-5)
    technical_skills_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    problem_solving_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    communication_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    learning_attitude_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    participation_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    overall_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # Qualitative Feedback
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    areas_for_improvement: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    trainer = relationship("User", foreign_keys=[trainer_id])
    trainee = relationship("User", foreign_keys=[trainee_id])
    batch = relationship("Batch", foreign_keys=[batch_id])
    course = relationship("Course", foreign_keys=[course_id])
