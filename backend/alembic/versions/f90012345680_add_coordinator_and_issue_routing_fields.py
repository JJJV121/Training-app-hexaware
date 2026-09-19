"""add coordinator and issue routing fields

Revision ID: f90012345680
Revises: f90012345679
Create Date: 2026-09-19 12:44:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f90012345680'
down_revision: Union[str, None] = 'f90012345679'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add assigned_to_user_id and escalated_to_admin to candidate_issues
    op.add_column('candidate_issues', sa.Column('assigned_to_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('candidate_issues', sa.Column('escalated_to_admin', sa.Boolean(), server_default='false', nullable=False))
    op.create_index(op.f('ix_candidate_issues_assigned_to_user_id'), 'candidate_issues', ['assigned_to_user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_candidate_issues_assigned_to_user_id'), table_name='candidate_issues')
    op.drop_column('candidate_issues', 'escalated_to_admin')
    op.drop_column('candidate_issues', 'assigned_to_user_id')
