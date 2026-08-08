from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class BatchTrainee(Base):
    __tablename__ = "batch_trainees"

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"),
        primary_key=True
    )

    trainee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        primary_key=True
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )