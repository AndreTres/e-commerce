import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TestDrive(Base):
    __tablename__ = "test_drives"

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
    data_agendamento: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_realizacao: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship("Cliente")  # noqa: F821
    veiculo: Mapped["Veiculo"] = relationship("Veiculo")  # noqa: F821
