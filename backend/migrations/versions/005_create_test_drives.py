"""Create test_drives table

Revision ID: 005
Revises: 004
Create Date: 2026-11-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "test_drives",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("veiculo_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("data_agendamento", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_realizacao", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["veiculo_id"], ["veiculos.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("test_drives")
