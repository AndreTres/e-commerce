from decimal import Decimal
from uuid import UUID

from app.core.config import settings
from app.core.financing_calculator import (
    calculate_financed_amount,
    calculate_price_installment,
)
from app.core.roles import UserRole
from app.models.simulacao_financiamento import SimulacaoFinanciamento
from app.models.usuario import Usuario
from app.modules.financing.repository import FinancingRepository
from app.modules.financing.schemas import SimulationCreateRequest

SIMULATION_NOT_FOUND = "Financing simulation not found"
SIMULATION_ACCESS_DENIED = "Access to this financing simulation is not allowed"
CLIENT_NOT_FOUND = "Client not found"
VEHICLE_NOT_FOUND = "Vehicle not found"
INVALID_VEHICLE_PRICE = "Vehicle price must be positive"
INVALID_DOWN_PAYMENT = "Down payment must be lower than the vehicle price"
CLIENT_PROFILE_REQUIRED = "Authenticated client account is not linked to a customer record"
CLIENT_ID_REQUIRED = "cliente_id is required for this operation"


class FinancingService:
    def __init__(self, repository: FinancingRepository) -> None:
        self._repository = repository

    def create_simulation(self, payload: SimulationCreateRequest, actor: Usuario) -> SimulacaoFinanciamento:
        role = UserRole(actor.role)
        cliente_id = self._resolve_client_id(payload, actor, role)

        client = self._repository.get_client(cliente_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)

        vehicle = self._repository.get_vehicle(payload.veiculo_id)
        if vehicle is None:
            raise ValueError(VEHICLE_NOT_FOUND)

        vehicle_price = Decimal(vehicle.preco)
        if vehicle_price <= Decimal("0"):
            raise ValueError(INVALID_VEHICLE_PRICE)

        down_payment = payload.valor_entrada.quantize(Decimal("0.01"))
        if down_payment >= vehicle_price:
            raise ValueError(INVALID_DOWN_PAYMENT)

        interest_rate = Decimal(settings.financing_monthly_interest_rate)
        financed_amount = calculate_financed_amount(vehicle_price, down_payment)
        installment = calculate_price_installment(
            financed_amount,
            interest_rate,
            payload.prazo_meses,
        )

        simulation = SimulacaoFinanciamento(
            cliente_id=cliente_id,
            veiculo_id=vehicle.id,
            valor_veiculo=vehicle_price,
            valor_entrada=down_payment,
            prazo_meses=payload.prazo_meses,
            taxa_juros=interest_rate,
            valor_parcela=installment,
        )
        return self._repository.create(simulation)

    def list_simulations(
        self,
        actor: Usuario,
        *,
        veiculo_id: UUID | None = None,
    ) -> list[SimulacaoFinanciamento]:
        role = UserRole(actor.role)
        cliente_id = None

        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            cliente_id = actor.cliente_id
        elif role == UserRole.ADMIN:
            pass
        else:
            raise ValueError(SIMULATION_ACCESS_DENIED)

        return self._repository.list_simulations(cliente_id=cliente_id, veiculo_id=veiculo_id)

    def get_simulation(self, simulation_id: UUID, actor: Usuario) -> SimulacaoFinanciamento:
        simulation = self._repository.get_by_id(simulation_id)
        if simulation is None:
            raise ValueError(SIMULATION_NOT_FOUND)
        self._ensure_can_access(simulation, actor)
        return simulation

    @staticmethod
    def _resolve_client_id(payload: SimulationCreateRequest, actor: Usuario, role: UserRole) -> UUID:
        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            return actor.cliente_id
        if role == UserRole.ADMIN:
            if payload.cliente_id is None:
                raise ValueError(CLIENT_ID_REQUIRED)
            return payload.cliente_id
        raise ValueError(SIMULATION_ACCESS_DENIED)

    @staticmethod
    def _ensure_can_access(simulation: SimulacaoFinanciamento, actor: Usuario) -> None:
        role = UserRole(actor.role)
        if role == UserRole.CLIENT:
            if actor.cliente_id != simulation.cliente_id:
                raise ValueError(SIMULATION_ACCESS_DENIED)
            return
        if role == UserRole.ADMIN:
            return
        raise ValueError(SIMULATION_ACCESS_DENIED)
