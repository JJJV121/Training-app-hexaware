"""merge all heads

Revision ID: cf00f2933fe1
Revises: 05c6f5850311, 2e2f5bee2b7a, 63e1f8a7f0bd, fc6d4e03ee9a
Create Date: 2026-08-12 19:09:30.202852

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf00f2933fe1'
down_revision: Union[str, Sequence[str], None] = ('05c6f5850311', '2e2f5bee2b7a', '63e1f8a7f0bd', 'fc6d4e03ee9a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
