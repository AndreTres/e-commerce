"""Create simulacoes_financiamento table

Revision ID: 006
Revises: 005
Create Date: 2026-11-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "simulacoes_financiamento",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("veiculo_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("valor_veiculo", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("valor_entrada", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("prazo_meses", sa.Integer(), nullable=False),
        sa.Column("taxa_juros", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.Column("valor_parcela", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "data_simulacao",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["veiculo_id"], ["veiculos.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("simulacoes_financiamento")
