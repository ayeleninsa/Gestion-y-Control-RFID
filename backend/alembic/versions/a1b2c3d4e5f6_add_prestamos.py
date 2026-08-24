"""Add prestamos table

Revision ID: a1b2c3d4e5f6
Revises: f7a3c2d9e1b8
Create Date: 2026-08-09 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f7a3c2d9e1b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'prestamos',
        sa.Column('id_prestamo', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('id_alumnos', sa.Integer(), nullable=True),
        sa.Column('id_computadoras', sa.Integer(), nullable=True),
        sa.Column('fecha_prestamo', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('fecha_devolucion', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estado', sa.String(length=20), server_default='Prestado', nullable=False),
        sa.ForeignKeyConstraint(['id_alumnos'], ['alumnos.id_alumnos'], name='fk_prestamos_alumno'),
        sa.ForeignKeyConstraint(['id_computadoras'], ['Computadoras.id_computadoras'], name='fk_prestamos_computadora'),
        sa.PrimaryKeyConstraint('id_prestamo', name='pk_prestamos'),
    )


def downgrade() -> None:
    op.drop_table('prestamos')