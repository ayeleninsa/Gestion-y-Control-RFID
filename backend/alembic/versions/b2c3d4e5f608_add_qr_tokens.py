"""Add qr_tokens table

Revision ID: b2c3d4e5f608
Revises: a1b2c3d4e5f6
Create Date: 2026-08-20 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f608'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'qr_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('preceptor_id', sa.Integer(), nullable=True),
        sa.Column('alumno_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['alumno_id'], ['users.id'], name='fk_qr_tokens_alumno'),
        sa.ForeignKeyConstraint(['preceptor_id'], ['users.id'], name='fk_qr_tokens_preceptor'),
        sa.PrimaryKeyConstraint('id', name='pk_qr_tokens'),
        sa.UniqueConstraint('token_hash', name='uq_qr_tokens_token_hash'),
    )
    op.create_index('ix_qr_tokens_token_hash', 'qr_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_qr_tokens_token_hash', table_name='qr_tokens')
    op.drop_table('qr_tokens')