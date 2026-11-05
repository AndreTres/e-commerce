from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.financing.repository import FinancingRepository
from app.modules.financing.schemas import SimulationCreateRequest, SimulationResponse
from app.modules.financing.service import (
    CLIENT_ID_REQUIRED,
    CLIENT_NOT_FOUND,
    CLIENT_PROFILE_REQUIRED,
    INVALID_DOWN_PAYMENT,
    INVALID_VEHICLE_PRICE,
    SIMULATION_ACCESS_DENIED,
    SIMULATION_NOT_FOUND,
    VEHICLE_NOT_FOUND,
    FinancingService,
)

router = APIRouter(prefix="/api/financing", tags=["financing"])

FinancingUsers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.CLIENT, UserRole.ADMIN)),
]


def get_financing_repository(db: Session = Depends(get_db)) -> FinancingRepository:
    return FinancingRepository(db)


def get_financing_service(
    repository: Annotated[FinancingRepository, Depends(get_financing_repository)],
) -> FinancingService:
    return FinancingService(repository)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    mapping = {
        SIMULATION_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        CLIENT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        VEHICLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        SIMULATION_ACCESS_DENIED: status.HTTP_403_FORBIDDEN,
        CLIENT_PROFILE_REQUIRED: status.HTTP_400_BAD_REQUEST,
        CLIENT_ID_REQUIRED: status.HTTP_422_UNPROCESSABLE_ENTITY,
        INVALID_VEHICLE_PRICE: status.HTTP_409_CONFLICT,
        INVALID_DOWN_PAYMENT: status.HTTP_422_UNPROCESSABLE_ENTITY,
    }
    status_code = mapping.get(message, status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/simulations", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
def create_simulation(
    payload: SimulationCreateRequest,
    actor: FinancingUsers,
    service: Annotated[FinancingService, Depends(get_financing_service)],
) -> SimulationResponse:
    try:
        simulation = service.create_simulation(payload, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return SimulationResponse.model_validate(simulation)


@router.get("/simulations", response_model=list[SimulationResponse])
def list_simulations(
    actor: FinancingUsers,
    service: Annotated[FinancingService, Depends(get_financing_service)],
    veiculo_id: UUID | None = None,
) -> list[SimulationResponse]:
    try:
        simulations = service.list_simulations(actor, veiculo_id=veiculo_id)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return [SimulationResponse.model_validate(item) for item in simulations]


@router.get("/simulations/{simulation_id}", response_model=SimulationResponse)
def get_simulation(
    simulation_id: UUID,
    actor: FinancingUsers,
    service: Annotated[FinancingService, Depends(get_financing_service)],
) -> SimulationResponse:
    try:
        simulation = service.get_simulation(simulation_id, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return SimulationResponse.model_validate(simulation)
