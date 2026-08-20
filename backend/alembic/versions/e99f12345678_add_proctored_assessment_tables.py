"""add_proctored_assessment_tables

Revision ID: e99f12345678
Revises: a98f12345678
Create Date: 2026-08-20 10:12:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e99f12345678'
down_revision: Union[str, Sequence[str], None] = 'a98f12345678'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Check & Update assessments table
    # Drop existing assessment_submissions if it exists or keep it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'assessments' not in tables:
        op.create_table(
            'assessments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('course_day_id', sa.Integer(), nullable=True),
            sa.Column('learning_unit_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('assessment_type', sa.Enum('MCQ', 'CODING', 'MIXED', name='assessment_type_enum'), nullable=False),
            sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'),
            sa.Column('total_marks', sa.Integer(), nullable=False, server_default='100'),
            sa.Column('passing_marks', sa.Integer(), nullable=False, server_default='70'),
            sa.Column('created_by', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['course_day_id'], ['course_days.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['learning_unit_id'], ['learning_units.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessments_course_day_id'), 'assessments', ['course_day_id'], unique=False)
        op.create_index(op.f('ix_assessments_id'), 'assessments', ['id'], unique=False)
    else:
        # Add columns if missing
        cols = [c['name'] for c in inspector.get_columns('assessments')]
        if 'learning_unit_id' not in cols:
            op.add_column('assessments', sa.Column('learning_unit_id', sa.Integer(), nullable=True))
            op.create_foreign_key(None, 'assessments', 'learning_units', ['learning_unit_id'], ['id'], ondelete='SET NULL')
        if 'duration_minutes' not in cols:
            op.add_column('assessments', sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'))

    # 2. assessment_questions
    if 'assessment_questions' not in tables:
        op.create_table(
            'assessment_questions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('assessment_id', sa.Integer(), nullable=False),
            sa.Column('question_number', sa.Integer(), nullable=False),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('question_type', sa.String(length=50), nullable=False, server_default='mcq'),
            sa.Column('points', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('explanation', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessment_questions_assessment_id'), 'assessment_questions', ['assessment_id'], unique=False)
        op.create_index(op.f('ix_assessment_questions_id'), 'assessment_questions', ['id'], unique=False)

    # 3. assessment_options
    if 'assessment_options' not in tables:
        op.create_table(
            'assessment_options',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('question_id', sa.Integer(), nullable=False),
            sa.Column('option_text', sa.Text(), nullable=False),
            sa.Column('is_correct', sa.Boolean(), nullable=False, server_default='false'),
            sa.ForeignKeyConstraint(['question_id'], ['assessment_questions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessment_options_id'), 'assessment_options', ['id'], unique=False)
        op.create_index(op.f('ix_assessment_options_question_id'), 'assessment_options', ['question_id'], unique=False)

    # 4. assessment_attempts
    if 'assessment_attempts' not in tables:
        op.create_table(
            'assessment_attempts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('assessment_id', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='in_progress'),
            sa.Column('current_question', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('started_at', sa.DateTime(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('submitted_at', sa.DateTime(), nullable=True),
            sa.Column('score', sa.Float(), nullable=True),
            sa.Column('total_marks', sa.Float(), nullable=True),
            sa.Column('passed', sa.Boolean(), nullable=True),
            sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessment_attempts_assessment_id'), 'assessment_attempts', ['assessment_id'], unique=False)
        op.create_index(op.f('ix_assessment_attempts_id'), 'assessment_attempts', ['id'], unique=False)
        op.create_index(op.f('ix_assessment_attempts_user_id'), 'assessment_attempts', ['user_id'], unique=False)

    # 5. assessment_answers
    if 'assessment_answers' not in tables:
        op.create_table(
            'assessment_answers',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('attempt_id', sa.Integer(), nullable=False),
            sa.Column('question_id', sa.Integer(), nullable=False),
            sa.Column('selected_option_ids', sa.JSON(), nullable=True),
            sa.Column('answer_text', sa.Text(), nullable=True),
            sa.Column('is_correct', sa.Boolean(), nullable=True),
            sa.Column('score_obtained', sa.Float(), nullable=True),
            sa.Column('answered_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['attempt_id'], ['assessment_attempts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['question_id'], ['assessment_questions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessment_answers_attempt_id'), 'assessment_answers', ['attempt_id'], unique=False)
        op.create_index(op.f('ix_assessment_answers_id'), 'assessment_answers', ['id'], unique=False)

    # 6. proctoring_events
    if 'proctoring_events' not in tables:
        op.create_table(
            'proctoring_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('attempt_id', sa.Integer(), nullable=False),
            sa.Column('event_type', sa.String(length=100), nullable=False),
            sa.Column('timestamp', sa.DateTime(), nullable=False),
            sa.Column('metadata_json', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['attempt_id'], ['assessment_attempts.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_proctoring_events_attempt_id'), 'proctoring_events', ['attempt_id'], unique=False)
        op.create_index(op.f('ix_proctoring_events_id'), 'proctoring_events', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('proctoring_events')
    op.drop_table('assessment_answers')
    op.drop_table('assessment_attempts')
    op.drop_table('assessment_options')
    op.drop_table('assessment_questions')
