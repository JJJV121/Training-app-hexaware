from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class HiddenTestCase(Base):
    __tablename__ = "hidden_test_cases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "coding_problems.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
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