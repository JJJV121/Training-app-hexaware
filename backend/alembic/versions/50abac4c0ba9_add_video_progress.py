"""add video progress

Revision ID: 50abac4c0ba9
Revises: d173bc20224f
Create Date: 2026-08-16

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "50abac4c0ba9"
down_revision: Union[str, Sequence[str], None] = "d173bc20224f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_progress",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "video_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "is_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),
        sa.Column(
            "completed_at",
            sa.DateTime(),
            nullable=True
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"]
        ),
        sa.ForeignKeyConstraint(
            ["video_id"],
            ["videos.id"]
        ),
        sa.UniqueConstraint(
            "user_id",
            "video_id",
            name="uq_video_progress_user_video"
        )
    )


def downgrade() -> None:
    op.drop_table("video_progress")