from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class LoginHistory(Base):
    __tablename__ = "login_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    login_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    ip_address: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    user_agent: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )