"""add_users_table

Revision ID: 1d1724f8e28e
Revises: c3796c5f2743
Create Date: 2026-05-24 16:38:46.087988

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '1d1724f8e28e'
down_revision: Union[str, None] = 'c3796c5f2743'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False, server_default="preceptor"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("id_persona", sa.Integer(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
        sa.ForeignKeyConstraint(
            ["id_persona"], ["Persona.id_persona"],
            name="fk_users_id_persona",
        ),
    )


def downgrade() -> None:
    op.drop_table("users")
