import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Venda(Base):
    __tablename__ = "vendas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cliente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clientes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    veiculo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("veiculos.id", ondelete="RESTRICT"),
        nullable=False,
    )
    data_venda: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    valor_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    forma_pagamento: Mapped[str] = mapped_column(String(20), nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship("Cliente")  # noqa: F821
    veiculo: Mapped["Veiculo"] = relationship("Veiculo")  # noqa: F821
