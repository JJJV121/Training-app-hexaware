"""add_feedback_and_reports_tables

Revision ID: f90012345681
Revises: f90012345680
Create Date: 2026-09-19 16:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f90012345681'
down_revision = 'f90012345680'
branch_labels = None
depends_on = None


def upgrade():
    # Create course_trainee_feedbacks
    op.create_table(
        'course_trainee_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trainee_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('trainer_id', sa.Integer(), nullable=True),
        sa.Column('video_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('video_comment', sa.Text(), nullable=True),
        sa.Column('practice_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('practice_comment', sa.Text(), nullable=True),
        sa.Column('coding_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('coding_comment', sa.Text(), nullable=True),
        sa.Column('trainer_support_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('trainer_support_comment', sa.Text(), nullable=True),
        sa.Column('overall_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('liked_comment', sa.Text(), nullable=True),
        sa.Column('improvement_comment', sa.Text(), nullable=True),
        sa.Column('overall_comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trainer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id', 'batch_id', 'course_id', name='uq_trainee_batch_course_feedback')
    )
    op.create_index(op.f('ix_course_trainee_feedbacks_id'), 'course_trainee_feedbacks', ['id'], unique=False)
    op.create_index(op.f('ix_course_trainee_feedbacks_trainee_id'), 'course_trainee_feedbacks', ['trainee_id'], unique=False)
    op.create_index(op.f('ix_course_trainee_feedbacks_batch_id'), 'course_trainee_feedbacks', ['batch_id'], unique=False)
    op.create_index(op.f('ix_course_trainee_feedbacks_course_id'), 'course_trainee_feedbacks', ['course_id'], unique=False)

    # Create trainer_evaluations
    op.create_table(
        'trainer_evaluations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trainer_id', sa.Integer(), nullable=False),
        sa.Column('trainee_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('technical_skills_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('problem_solving_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('communication_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('learning_attitude_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('participation_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('overall_rating', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('strengths', sa.Text(), nullable=True),
        sa.Column('areas_for_improvement', sa.Text(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['trainer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trainer_evaluations_id'), 'trainer_evaluations', ['id'], unique=False)
    op.create_index(op.f('ix_trainer_evaluations_trainer_id'), 'trainer_evaluations', ['trainer_id'], unique=False)
    op.create_index(op.f('ix_trainer_evaluations_trainee_id'), 'trainer_evaluations', ['trainee_id'], unique=False)
    op.create_index(op.f('ix_trainer_evaluations_batch_id'), 'trainer_evaluations', ['batch_id'], unique=False)

    # Create trainee_report_overrides
    op.create_table(
        'trainee_report_overrides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trainee_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('comment_reason', sa.Text(), nullable=True),
        sa.Column('final_status_override', sa.String(length=50), nullable=True),
        sa.Column('created_by_user_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id', 'batch_id', name='uq_trainee_batch_report_override')
    )
    op.create_index(op.f('ix_trainee_report_overrides_id'), 'trainee_report_overrides', ['id'], unique=False)
    op.create_index(op.f('ix_trainee_report_overrides_trainee_id'), 'trainee_report_overrides', ['trainee_id'], unique=False)
    op.create_index(op.f('ix_trainee_report_overrides_batch_id'), 'trainee_report_overrides', ['batch_id'], unique=False)


def downgrade():
    op.drop_table('trainee_report_overrides')
    op.drop_table('trainer_evaluations')
    op.drop_table('course_trainee_feedbacks')
