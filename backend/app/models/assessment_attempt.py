from app.database.base import Base
from sqlalchemy import (
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Float
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)
from datetime import datetime
class AssessmentAttempt(Base):

    __tablename__ = "assessment_attempts"

    id = mapped_column(Integer, primary_key=True)

    assessment_id = mapped_column(
        ForeignKey("assessments.id")
    )

    user_id = mapped_column(
        ForeignKey("users.id")
    )

    started_at = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    submitted_at = mapped_column(
        DateTime,
        nullable=True
    )

    score = mapped_column(
        Integer,
        default=0
    )

    percentage = mapped_column(
        Float,
        default=0
    )

    passed = mapped_column(
        Boolean,
        default=False
    )

    status = mapped_column(
        String(20),
        default="started"
    )