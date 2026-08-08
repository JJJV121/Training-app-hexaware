from datetime import datetime

from sqlalchemy import (
    Integer,
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


class CodingTestCase(Base):

    __tablename__ = "coding_test_cases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "coding_problems.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    input_data: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    is_hidden: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )