"""Create pagamentos table

Revision ID: 004
Revises: 003
Create Date: 2026-11-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pagamentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("venda_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("valor", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "data_pagamento",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["venda_id"], ["vendas.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("pagamentos")
