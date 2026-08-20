"""add coding fields to assessment tables

Revision ID: add_coding_fields_assessment
Revises: e99f12345678
Create Date: 2026-08-20 18:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'add_coding_fields_assessment'
down_revision: Union[str, Sequence[str], None] = 'e99f12345678'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'assessment_questions' in tables:
        cols = [c['name'] for c in inspector.get_columns('assessment_questions')]
        if 'title' not in cols:
            op.add_column('assessment_questions', sa.Column('title', sa.String(length=255), nullable=True))
        if 'input_format' not in cols:
            op.add_column('assessment_questions', sa.Column('input_format', sa.Text(), nullable=True))
        if 'output_format' not in cols:
            op.add_column('assessment_questions', sa.Column('output_format', sa.Text(), nullable=True))
        if 'constraints' not in cols:
            op.add_column('assessment_questions', sa.Column('constraints', sa.Text(), nullable=True))
        if 'sample_input' not in cols:
            op.add_column('assessment_questions', sa.Column('sample_input', sa.Text(), nullable=True))
        if 'sample_output' not in cols:
            op.add_column('assessment_questions', sa.Column('sample_output', sa.Text(), nullable=True))
        if 'difficulty' not in cols:
            op.add_column('assessment_questions', sa.Column('difficulty', sa.String(length=50), nullable=True))
        if 'allowed_language' not in cols:
            op.add_column('assessment_questions', sa.Column('allowed_language', sa.String(length=100), nullable=True))
        if 'starter_code' not in cols:
            op.add_column('assessment_questions', sa.Column('starter_code', sa.Text(), nullable=True))
        if 'test_cases' not in cols:
            op.add_column('assessment_questions', sa.Column('test_cases', sa.JSON(), nullable=True))

    if 'assessment_answers' in tables:
        cols = [c['name'] for c in inspector.get_columns('assessment_answers')]
        if 'language' not in cols:
            op.add_column('assessment_answers', sa.Column('language', sa.String(length=50), nullable=True))
        if 'code' not in cols:
            op.add_column('assessment_answers', sa.Column('code', sa.Text(), nullable=True))
        if 'status' not in cols:
            op.add_column('assessment_answers', sa.Column('status', sa.String(length=50), nullable=True))
        if 'execution_time' not in cols:
            op.add_column('assessment_answers', sa.Column('execution_time', sa.Float(), nullable=True))
        if 'passed_test_cases' not in cols:
            op.add_column('assessment_answers', sa.Column('passed_test_cases', sa.Integer(), nullable=True))
        if 'total_test_cases' not in cols:
            op.add_column('assessment_answers', sa.Column('total_test_cases', sa.Integer(), nullable=True))


def downgrade() -> None:
    pass
