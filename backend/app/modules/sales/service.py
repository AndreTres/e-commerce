from uuid import UUID

from app.core.roles import UserRole
from app.core.sale_status import ALLOWED_SALE_TRANSITIONS, SaleStatus
from app.core.vehicle_status import VehicleStatus
from app.models.usuario import Usuario
from app.models.venda import Venda
from app.modules.sales.repository import SaleRepository
from app.modules.sales.schemas import SaleCreateRequest, SaleListFilters

SALE_NOT_FOUND = "Sale not found"
SALE_ACCESS_DENIED = "Access to this sale is not allowed"
CLIENT_NOT_FOUND = "Client not found"
VEHICLE_NOT_FOUND = "Vehicle not found"
VEHICLE_NOT_AVAILABLE = "Vehicle is not available for sale"
CLIENT_PROFILE_REQUIRED = "Authenticated client account is not linked to a customer record"
CLIENT_ID_REQUIRED = "cliente_id is required for this operation"
INVALID_STATUS_TRANSITION = "Sale status transition is not allowed"
VEHICLE_ALREADY_SOLD = "Vehicle has already been sold"


class SaleService:
    def __init__(self, repository: SaleRepository) -> None:
        self._repository = repository

    def register_sale(self, payload: SaleCreateRequest, actor: Usuario) -> Venda:
        role = UserRole(actor.role)
        cliente_id = self._resolve_client_id(payload, actor, role)

        client = self._repository.get_client(cliente_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)

        try:
            vehicle = self._repository.get_vehicle_for_update(payload.veiculo_id)
            if vehicle is None:
                raise ValueError(VEHICLE_NOT_FOUND)
            if vehicle.status != VehicleStatus.DISPONIVEL:
                raise ValueError(VEHICLE_NOT_AVAILABLE)
            if self._repository.has_active_sale_for_vehicle(vehicle.id):
                raise ValueError(VEHICLE_NOT_AVAILABLE)

            return self._repository.register_sale(
                cliente_id=cliente_id,
                vehicle=vehicle,
                valor_total=vehicle.preco,
                forma_pagamento=payload.forma_pagamento.value,
                observacoes=payload.observacoes,
            )
        except ValueError:
            self._repository.rollback()
            raise
        except Exception:
            self._repository.rollback()
            raise

    def list_sales(self, actor: Usuario, filters: SaleListFilters) -> list[Venda]:
        role = UserRole(actor.role)
        cliente_id = filters.cliente_id
        veiculo_id = filters.veiculo_id

        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            cliente_id = actor.cliente_id
            veiculo_id = None

        self._ensure_can_list(role)
        return self._repository.list_sales(
            cliente_id=cliente_id,
            veiculo_id=veiculo_id,
            status=filters.status,
        )

    def get_sale(self, sale_id: UUID, actor: Usuario) -> Venda:
        sale = self._repository.get_by_id(sale_id)
        if sale is None:
            raise ValueError(SALE_NOT_FOUND)
        self._ensure_can_access_sale(sale, actor)
        return sale

    def update_status(self, sale_id: UUID, new_status: SaleStatus) -> Venda:
        try:
            sale = self._repository.get_by_id(sale_id)
            if sale is None:
                raise ValueError(SALE_NOT_FOUND)

            current_status = SaleStatus(sale.status)
            if new_status not in ALLOWED_SALE_TRANSITIONS[current_status]:
                raise ValueError(INVALID_STATUS_TRANSITION)

            vehicle = self._repository.get_vehicle_for_update(sale.veiculo_id)
            if vehicle is None:
                raise ValueError(VEHICLE_NOT_FOUND)

            if new_status == SaleStatus.CONCLUIDA:
                if vehicle.status == VehicleStatus.VENDIDO and current_status != SaleStatus.CONCLUIDA:
                    raise ValueError(VEHICLE_ALREADY_SOLD)
                if self._repository.has_active_sale_for_vehicle(
                    sale.veiculo_id,
                    exclude_sale_id=sale.id,
                ):
                    raise ValueError(VEHICLE_NOT_AVAILABLE)
                vehicle.status = VehicleStatus.VENDIDO

            if new_status == SaleStatus.CANCELADA:
                if not self._repository.has_active_sale_for_vehicle(
                    sale.veiculo_id,
                    exclude_sale_id=sale.id,
                ):
                    if vehicle.status == VehicleStatus.RESERVADO:
                        vehicle.status = VehicleStatus.DISPONIVEL

            if new_status == SaleStatus.EM_PROCESSAMENTO:
                if vehicle.status not in (VehicleStatus.RESERVADO, VehicleStatus.DISPONIVEL):
                    if vehicle.status == VehicleStatus.VENDIDO:
                        raise ValueError(VEHICLE_ALREADY_SOLD)
                vehicle.status = VehicleStatus.RESERVADO

            sale.status = new_status
            return self._repository.update_sale_and_vehicle(sale, vehicle)
        except ValueError:
            self._repository.rollback()
            raise
        except Exception:
            self._repository.rollback()
            raise

    @staticmethod
    def _resolve_client_id(payload: SaleCreateRequest, actor: Usuario, role: UserRole) -> UUID:
        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            return actor.cliente_id

        if payload.cliente_id is None:
            raise ValueError(CLIENT_ID_REQUIRED)
        return payload.cliente_id

    @staticmethod
    def _ensure_can_list(role: UserRole) -> None:
        if role not in (UserRole.CLIENT, UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN):
            raise ValueError(SALE_ACCESS_DENIED)

    @staticmethod
    def _ensure_can_access_sale(sale: Venda, actor: Usuario) -> None:
        role = UserRole(actor.role)
        if role == UserRole.CLIENT:
            if actor.cliente_id != sale.cliente_id:
                raise ValueError(SALE_ACCESS_DENIED)
            return
        if role in (UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN):
            return
        raise ValueError(SALE_ACCESS_DENIED)
