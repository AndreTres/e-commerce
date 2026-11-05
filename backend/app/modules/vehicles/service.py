from decimal import Decimal
from uuid import UUID

from app.core.vehicle_status import VehicleStatus
from app.models.veiculo import Veiculo
from app.modules.vehicles.repository import VehicleRepository
from app.modules.vehicles.schemas import VehicleCreateRequest, VehicleUpdateRequest

VEHICLE_NOT_FOUND = "Vehicle not found"
INVALID_STATUS_TRANSITION = "Status change is not allowed for the current vehicle state"


class VehicleService:
    def __init__(self, repository: VehicleRepository) -> None:
        self._repository = repository

    def list_catalog(
        self,
        *,
        marca: str | None = None,
        modelo: str | None = None,
        ano: int | None = None,
        cor: str | None = None,
        preco_min: Decimal | None = None,
        preco_max: Decimal | None = None,
    ) -> list[Veiculo]:
        return self._repository.list_available(
            marca=marca,
            modelo=modelo,
            ano=ano,
            cor=cor,
            preco_min=preco_min,
            preco_max=preco_max,
        )

    def get_vehicle(self, vehicle_id: UUID) -> Veiculo:
        vehicle = self._repository.get_by_id(vehicle_id)
        if vehicle is None:
            raise ValueError(VEHICLE_NOT_FOUND)
        return vehicle

    def register_vehicle(self, payload: VehicleCreateRequest) -> Veiculo:
        vehicle = Veiculo(
            marca=payload.marca.strip(),
            modelo=payload.modelo.strip(),
            ano=payload.ano,
            cor=payload.cor.strip(),
            quilometragem=payload.quilometragem,
            preco=payload.preco,
            status=VehicleStatus.DISPONIVEL,
            descricao=payload.descricao.strip(),
        )
        return self._repository.create(vehicle)

    def update_vehicle(self, vehicle_id: UUID, payload: VehicleUpdateRequest) -> Veiculo:
        vehicle = self.get_vehicle(vehicle_id)
        vehicle.marca = payload.marca.strip()
        vehicle.modelo = payload.modelo.strip()
        vehicle.ano = payload.ano
        vehicle.cor = payload.cor.strip()
        vehicle.quilometragem = payload.quilometragem
        vehicle.preco = payload.preco
        vehicle.descricao = payload.descricao.strip()
        return self._repository.update(vehicle)

    def update_status(self, vehicle_id: UUID, new_status: VehicleStatus) -> Veiculo:
        vehicle = self.get_vehicle(vehicle_id)
        current_status = VehicleStatus(vehicle.status)

        if not self._is_status_transition_allowed(current_status, new_status):
            raise ValueError(INVALID_STATUS_TRANSITION)

        vehicle.status = new_status
        return self._repository.update_status(vehicle)

    @staticmethod
    def _is_status_transition_allowed(
        current: VehicleStatus,
        new: VehicleStatus,
    ) -> bool:
        if current == new:
            return True

        if current == VehicleStatus.VENDIDO:
            return False

        if new == VehicleStatus.DISPONIVEL and current in (
            VehicleStatus.RESERVADO,
            VehicleStatus.VENDIDO,
        ):
            return False

        return True
