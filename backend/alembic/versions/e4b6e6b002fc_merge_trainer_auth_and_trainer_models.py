"""merge trainer auth and trainer models

Revision ID: e4b6e6b002fc
Revises: 05c6f5850311, d173bc20224f
Create Date: 2026-08-08 22:20:11.223344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4b6e6b002fc'
down_revision: Union[str, Sequence[str], None] = ('05c6f5850311', 'd173bc20224f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
