import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class SimulacaoFinanciamento(Base):
    __tablename__ = "simulacoes_financiamento"

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
    valor_veiculo: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    valor_entrada: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    prazo_meses: Mapped[int] = mapped_column(Integer, nullable=False)
    taxa_juros: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    valor_parcela: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    data_simulacao: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cliente: Mapped["Cliente"] = relationship("Cliente")  # noqa: F821
    veiculo: Mapped["Veiculo"] = relationship("Veiculo")  # noqa: F821
