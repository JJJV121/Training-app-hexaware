from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class MCQQuestionBank(Base):
    __tablename__ = "mcq_question_bank"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    learning_unit_id: Mapped[int | None] = mapped_column(
        ForeignKey("learning_units.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
        default=1,
        index=True
    )
    category: Mapped[str] = mapped_column(String(100), default="java", index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    subtopic: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    set_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    question_no: Mapped[int | None] = mapped_column(Integer, nullable=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str] = mapped_column(Text, nullable=False)
    option_b: Mapped[str] = mapped_column(Text, nullable=False)
    option_c: Mapped[str] = mapped_column(Text, nullable=False)
    option_d: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(10), nullable=False)  # 'A', 'B', 'C', 'D'
    correct_answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False) # 'EASY', 'MEDIUM', 'HARD'
    question_type: Mapped[str | None] = mapped_column(String(100), default="Concept", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
