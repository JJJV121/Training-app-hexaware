"""add college_name to batches and users

Revision ID: e8f900123456
Revises: cf00f2933fe1
Create Date: 2026-08-17 20:56:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8f900123456'
down_revision = ('50abac4c0ba9', 'b0c14693c641', 'ee1062600099')
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    batches_cols = [c['name'] for c in inspector.get_columns('batches')]
    if 'college_name' not in batches_cols:
        op.add_column('batches', sa.Column('college_name', sa.String(length=255), nullable=True))
        
    users_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'college_name' not in users_cols:
        op.add_column('users', sa.Column('college_name', sa.String(length=255), nullable=True))


def downgrade():
    op.drop_column('batches', 'college_name')
    op.drop_column('users', 'college_name')
