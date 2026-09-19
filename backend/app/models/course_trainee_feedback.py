from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CourseTraineeFeedback(Base):
    __tablename__ = "course_trainee_feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
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
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    trainer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # 1. Video Content Feedback
    video_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    video_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 2. Practice Questions Feedback
    practice_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    practice_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 3. Coding Challenges Feedback
    coding_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    coding_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 4. Trainer Support Feedback
    trainer_support_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    trainer_support_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 5. Overall Trainee Feedback
    overall_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    liked_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvement_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    trainee = relationship("User", foreign_keys=[trainee_id])
    batch = relationship("Batch", foreign_keys=[batch_id])
    course = relationship("Course", foreign_keys=[course_id])
    trainer = relationship("User", foreign_keys=[trainer_id])

    __table_args__ = (
        UniqueConstraint("trainee_id", "batch_id", "course_id", name="uq_trainee_batch_course_feedback"),
    )
