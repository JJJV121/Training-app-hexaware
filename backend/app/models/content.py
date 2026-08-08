from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text

from app.database.base import Base


class Content(Base):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    learning_unit_id: Mapped[int] = mapped_column(
        ForeignKey("learning_units.id"),
        nullable=False
    )

    content_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

