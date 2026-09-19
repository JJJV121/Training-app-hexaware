"""add_issues_and_notifications_tables

Revision ID: f90012345679
Revises: e99f12345678
Create Date: 2026-09-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f90012345679'
down_revision = None  # Or set to head
branch_labels = None
depends_on = None


def upgrade():
    # Create candidate_issues table
    op.create_table(
        'candidate_issues',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('issue_id', sa.String(length=50), nullable=False),
        sa.Column('candidate_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id', ondelete='SET NULL'), nullable=True),
        sa.Column('issue_type', sa.String(length=100), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='OPEN'),
        sa.Column('admin_response', sa.Text(), nullable=True),
        sa.Column('attachment_url', sa.String(length=500), nullable=True),
        sa.Column('resolved_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_candidate_issues_issue_id', 'candidate_issues', ['issue_id'], unique=True)
    op.create_index('ix_candidate_issues_candidate_id', 'candidate_issues', ['candidate_id'], unique=False)
    op.create_index('ix_candidate_issues_status', 'candidate_issues', ['status'], unique=False)

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('channel', sa.String(length=50), nullable=False, server_default='IN_APP'),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_notification_type', 'notifications', ['notification_type'], unique=False)
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'], unique=False)


def downgrade():
    op.drop_table('notifications')
    op.drop_table('candidate_issues')
