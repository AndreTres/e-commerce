"""Initial auth-related tables

Revision ID: 001
Revises:
Create Date: 2026-11-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clientes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("cpf_cnpj", sa.String(length=14), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefone", sa.String(length=20), nullable=False),
        sa.Column("endereco", sa.String(length=500), nullable=False),
        sa.Column(
            "data_cadastro",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cpf_cnpj"),
    )
    op.create_table(
        "colaboradores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefone", sa.String(length=20), nullable=False),
        sa.Column("cargo", sa.String(length=100), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("colaborador_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cliente_id"),
        sa.UniqueConstraint("colaborador_id"),
        sa.UniqueConstraint("email"),
    )


def downgrade() -> None:
    op.drop_table("usuarios")
    op.drop_table("colaboradores")
    op.drop_table("clientes")
