"""add_tag_rfid_and_activa_to_computadoras

Revision ID: 48000b47d7a0
Revises: 84086fcf91c4
Create Date: 2026-05-28 10:38:29.024368

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '48000b47d7a0'
down_revision: Union[str, None] = '84086fcf91c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('Computadoras', sa.Column('tag_rfid', sa.String(length=100), nullable=True))
    op.add_column(
        'Computadoras',
        sa.Column('activa', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_unique_constraint('uq_computadoras_tag_rfid', 'Computadoras', ['tag_rfid'])


def downgrade() -> None:
    op.drop_constraint('uq_computadoras_tag_rfid', 'Computadoras', type_='unique')
    op.drop_column('Computadoras', 'activa')
    op.drop_column('Computadoras', 'tag_rfid')
