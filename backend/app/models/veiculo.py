import uuid
from decimal import Decimal

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    cor: Mapped[str] = mapped_column(String(100), nullable=False)
    quilometragem: Mapped[int] = mapped_column(Integer, nullable=False)
    preco: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False, default="")
