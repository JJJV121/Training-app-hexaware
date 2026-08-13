"""merge all migration heads

Revision ID: 24dbd16240b3
Revises: 05c6f5850311, 2e2f5bee2b7a, 63e1f8a7f0bd
Create Date: 2026-08-09 22:46:46.222965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24dbd16240b3'
down_revision: Union[str, Sequence[str], None] = ('05c6f5850311', '2e2f5bee2b7a', '63e1f8a7f0bd')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
