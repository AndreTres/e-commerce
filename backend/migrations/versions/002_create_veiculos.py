"""Create veiculos table

Revision ID: 002
Revises: 001
Create Date: 2026-11-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "veiculos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("marca", sa.String(length=100), nullable=False),
        sa.Column("modelo", sa.String(length=100), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("cor", sa.String(length=100), nullable=False),
        sa.Column("quilometragem", sa.Integer(), nullable=False),
        sa.Column("preco", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("veiculos")
