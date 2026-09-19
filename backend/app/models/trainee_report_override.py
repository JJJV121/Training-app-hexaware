from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TraineeReportOverride(Base):
    __tablename__ = "trainee_report_overrides"

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

    comment_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_status_override: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    trainee = relationship("User", foreign_keys=[trainee_id])
    batch = relationship("Batch", foreign_keys=[batch_id])
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    __table_args__ = (
        UniqueConstraint("trainee_id", "batch_id", name="uq_trainee_batch_report_override"),
    )
