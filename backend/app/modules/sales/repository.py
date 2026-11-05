from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.sale_status import ACTIVE_SALE_STATUSES, SaleStatus
from app.core.vehicle_status import VehicleStatus
from app.models.cliente import Cliente
from app.models.veiculo import Veiculo
from app.models.venda import Venda


class SaleRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, sale_id: UUID) -> Venda | None:
        statement = (
            select(Venda)
            .options(joinedload(Venda.cliente), joinedload(Venda.veiculo))
            .where(Venda.id == sale_id)
        )
        return self._db.scalar(statement)

    def list_sales(
        self,
        *,
        cliente_id: UUID | None = None,
        veiculo_id: UUID | None = None,
        status: SaleStatus | None = None,
    ) -> list[Venda]:
        statement = select(Venda).options(joinedload(Venda.cliente), joinedload(Venda.veiculo))
        if cliente_id is not None:
            statement = statement.where(Venda.cliente_id == cliente_id)
        if veiculo_id is not None:
            statement = statement.where(Venda.veiculo_id == veiculo_id)
        if status is not None:
            statement = statement.where(Venda.status == status)
        statement = statement.order_by(Venda.data_venda.desc())
        return list(self._db.scalars(statement).unique().all())

    def get_client(self, client_id: UUID) -> Cliente | None:
        return self._db.get(Cliente, client_id)

    def get_vehicle_for_update(self, vehicle_id: UUID) -> Veiculo | None:
        statement = select(Veiculo).where(Veiculo.id == vehicle_id).with_for_update()
        return self._db.scalar(statement)

    def has_active_sale_for_vehicle(self, vehicle_id: UUID, *, exclude_sale_id: UUID | None = None) -> bool:
        statement = select(Venda.id).where(
            Venda.veiculo_id == vehicle_id,
            Venda.status.in_(tuple(ACTIVE_SALE_STATUSES)),
        )
        if exclude_sale_id is not None:
            statement = statement.where(Venda.id != exclude_sale_id)
        return self._db.scalar(statement) is not None

    def register_sale(
        self,
        *,
        cliente_id: UUID,
        vehicle: Veiculo,
        valor_total: Decimal,
        forma_pagamento: str,
        observacoes: str | None,
    ) -> Venda:
        sale = Venda(
            cliente_id=cliente_id,
            veiculo_id=vehicle.id,
            valor_total=valor_total,
            status=SaleStatus.PENDENTE,
            forma_pagamento=forma_pagamento,
            observacoes=observacoes,
        )
        vehicle.status = VehicleStatus.RESERVADO
        self._db.add(sale)
        self._db.commit()
        self._db.refresh(sale)
        return self.get_by_id(sale.id) or sale

    def update_sale_and_vehicle(self, sale: Venda, vehicle: Veiculo) -> Venda:
        self._db.commit()
        refreshed = self.get_by_id(sale.id)
        if refreshed is None:
            self._db.refresh(sale)
            return sale
        return refreshed

    def rollback(self) -> None:
        self._db.rollback()
