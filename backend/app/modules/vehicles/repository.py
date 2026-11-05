from decimal import Decimal
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.core.vehicle_status import VehicleStatus
from app.models.veiculo import Veiculo


class VehicleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_available(
        self,
        *,
        marca: str | None = None,
        modelo: str | None = None,
        ano: int | None = None,
        cor: str | None = None,
        preco_min: Decimal | None = None,
        preco_max: Decimal | None = None,
    ) -> list[Veiculo]:
        statement = self._apply_catalog_filters(
            select(Veiculo).where(Veiculo.status == VehicleStatus.DISPONIVEL),
            marca=marca,
            modelo=modelo,
            ano=ano,
            cor=cor,
            preco_min=preco_min,
            preco_max=preco_max,
        )
        statement = statement.order_by(Veiculo.marca, Veiculo.modelo, Veiculo.ano)
        return list(self._db.scalars(statement).all())

    def get_by_id(self, vehicle_id: UUID) -> Veiculo | None:
        return self._db.get(Veiculo, vehicle_id)

    def create(self, vehicle: Veiculo) -> Veiculo:
        self._db.add(vehicle)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def update(self, vehicle: Veiculo) -> Veiculo:
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def update_status(self, vehicle: Veiculo) -> Veiculo:
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    @staticmethod
    def _apply_catalog_filters(
        statement: Select[tuple[Veiculo]],
        *,
        marca: str | None,
        modelo: str | None,
        ano: int | None,
        cor: str | None,
        preco_min: Decimal | None,
        preco_max: Decimal | None,
    ) -> Select[tuple[Veiculo]]:
        if marca:
            statement = statement.where(Veiculo.marca.ilike(marca))
        if modelo:
            statement = statement.where(Veiculo.modelo.ilike(modelo))
        if ano is not None:
            statement = statement.where(Veiculo.ano == ano)
        if cor:
            statement = statement.where(Veiculo.cor.ilike(cor))
        if preco_min is not None:
            statement = statement.where(Veiculo.preco >= preco_min)
        if preco_max is not None:
            statement = statement.where(Veiculo.preco <= preco_max)
        return statement
