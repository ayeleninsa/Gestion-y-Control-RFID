"""Widen carreras.ano to varchar(255)

Revision ID: f7a3c2d9e1b8
Revises: 0dd7c8477afb
Create Date: 2026-08-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a3c2d9e1b8'
down_revision: Union[str, None] = '0dd7c8477afb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'carreras',
        'año',
        type_=sa.String(length=255),
        existing_type=sa.String(length=10),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'carreras',
        'año',
        type_=sa.String(length=10),
        existing_type=sa.String(length=255),
        existing_nullable=True,
    )