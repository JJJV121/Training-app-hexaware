"""create_trainer_module_tables

Revision ID: b0c14693c641
Revises: 24dbd16240b3
Create Date: 2026-08-13 18:32:35.214016

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b0c14693c641'
down_revision: Union[str, Sequence[str], None] = '24dbd16240b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing attendancestatus type if it exists to prevent conflict
    op.execute("DROP TYPE IF EXISTS attendancestatus CASCADE")

    # 1. Create live_sessions table
    op.create_table('live_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('session_type', sa.String(length=50), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('trainer_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('meeting_link', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ),
        sa.ForeignKeyConstraint(['trainer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_live_sessions_id'), 'live_sessions', ['id'], unique=False)

    # 2. Create attendance_records table (this will automatically create the enum type attendancestatus)
    op.create_table('attendance_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('trainee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PRESENT', 'ABSENT', 'LATE', name='attendancestatus'), nullable=False),
        sa.Column('marked_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['live_sessions.id'], ),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_records_id'), 'attendance_records', ['id'], unique=False)

    # 3. Update batch_trainees table (drop id/status, adjust composite primary key)
    # Drop existing primary key on 'id' and drop columns
    op.execute("ALTER TABLE batch_trainees DROP CONSTRAINT IF EXISTS batch_trainees_pkey CASCADE")
    op.execute("DROP INDEX IF EXISTS ix_batch_trainees_id")
    op.execute("ALTER TABLE batch_trainees DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE batch_trainees DROP COLUMN IF EXISTS id")
    # Add composite primary key constraint
    op.create_primary_key('batch_trainees_pkey', 'batch_trainees', ['batch_id', 'trainee_id'])

    # 4. Update batches table (add is_active, remove created_by, start_time, end_time, status, max_strength)
    op.add_column('batches', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.alter_column('batches', 'name',
               existing_type=sa.VARCHAR(length=150),
               type_=sa.String(length=255),
               existing_nullable=False)
    op.alter_column('batches', 'trainer_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.execute("ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_created_by_fkey CASCADE")
    op.execute("ALTER TABLE batches DROP COLUMN IF EXISTS created_by")
    op.execute("ALTER TABLE batches DROP COLUMN IF EXISTS start_time")
    op.execute("ALTER TABLE batches DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE batches DROP COLUMN IF EXISTS max_strength")
    op.execute("ALTER TABLE batches DROP COLUMN IF EXISTS end_time")


def downgrade() -> None:
    # Revert batches table updates
    op.add_column('batches', sa.Column('end_time', postgresql.TIME(), autoincrement=False, nullable=True))
    op.add_column('batches', sa.Column('max_strength', sa.Integer(), autoincrement=False, nullable=False, server_default='20'))
    op.add_column('batches', sa.Column('status', sa.VARCHAR(length=20), autoincrement=False, nullable=False, server_default='active'))
    op.add_column('batches', sa.Column('start_time', postgresql.TIME(), autoincrement=False, nullable=True))
    op.add_column('batches', sa.Column('created_by', sa.Integer(), autoincrement=False, nullable=False, server_default='1'))
    op.create_foreign_key('batches_created_by_fkey', 'batches', 'users', ['created_by'], ['id'])
    op.alter_column('batches', 'trainer_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('batches', 'name',
               existing_type=sa.String(length=255),
               type_=sa.VARCHAR(length=150),
               existing_nullable=False)
    op.drop_column('batches', 'is_active')

    # Revert batch_trainees table updates
    op.execute("ALTER TABLE batch_trainees DROP CONSTRAINT IF EXISTS batch_trainees_pkey CASCADE")
    op.add_column('batch_trainees', sa.Column('id', sa.Integer(), autoincrement=True, nullable=False))
    op.add_column('batch_trainees', sa.Column('status', sa.VARCHAR(length=20), autoincrement=False, nullable=False, server_default='enrolled'))
    op.create_primary_key('batch_trainees_pkey', 'batch_trainees', ['id'])
    op.create_index('ix_batch_trainees_id', 'batch_trainees', ['id'], unique=False)

    # Revert attendance_records
    op.drop_index(op.f('ix_attendance_records_id'), table_name='attendance_records')
    op.drop_table('attendance_records')

    # Drop Enum type for AttendanceStatus
    op.execute("DROP TYPE IF EXISTS attendancestatus CASCADE")

    # Revert live_sessions
    op.drop_index(op.f('ix_live_sessions_id'), table_name='live_sessions')
    op.drop_table('live_sessions')
