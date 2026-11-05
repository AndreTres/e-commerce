from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_roles
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.vehicles.repository import VehicleRepository
from app.modules.vehicles.schemas import (
    VehicleCreateRequest,
    VehicleResponse,
    VehicleStatusUpdateRequest,
    VehicleUpdateRequest,
)
from app.modules.vehicles.service import INVALID_STATUS_TRANSITION, VEHICLE_NOT_FOUND, VehicleService

from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

VehicleManagers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]


def get_vehicle_repository(db: Session = Depends(get_db)) -> VehicleRepository:
    return VehicleRepository(db)


def get_vehicle_service(
    repository: Annotated[VehicleRepository, Depends(get_vehicle_repository)],
) -> VehicleService:
    return VehicleService(repository)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    service: Annotated[VehicleService, Depends(get_vehicle_service)],
    marca: str | None = None,
    modelo: str | None = None,
    ano: int | None = Query(default=None, ge=1900),
    cor: str | None = None,
    preco_min: Decimal | None = Query(default=None, ge=0),
    preco_max: Decimal | None = Query(default=None, ge=0),
) -> list[VehicleResponse]:
    if preco_min is not None and preco_max is not None and preco_min > preco_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="preco_min must be less than or equal to preco_max",
        )

    vehicles = service.list_catalog(
        marca=marca,
        modelo=modelo,
        ano=ano,
        cor=cor,
        preco_min=preco_min,
        preco_max=preco_max,
    )
    return [VehicleResponse.model_validate(vehicle) for vehicle in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: UUID,
    service: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> VehicleResponse:
    try:
        vehicle = service.get_vehicle(vehicle_id)
    except ValueError as exc:
        if str(exc) == VEHICLE_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VEHICLE_NOT_FOUND) from exc
        raise
    return VehicleResponse.model_validate(vehicle)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def register_vehicle(
    payload: VehicleCreateRequest,
    _: VehicleManagers,
    service: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> VehicleResponse:
    vehicle = service.register_vehicle(payload)
    return VehicleResponse.model_validate(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: UUID,
    payload: VehicleUpdateRequest,
    _: VehicleManagers,
    service: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> VehicleResponse:
    try:
        vehicle = service.update_vehicle(vehicle_id, payload)
    except ValueError as exc:
        if str(exc) == VEHICLE_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VEHICLE_NOT_FOUND) from exc
        raise
    return VehicleResponse.model_validate(vehicle)


@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(
    vehicle_id: UUID,
    payload: VehicleStatusUpdateRequest,
    _: VehicleManagers,
    service: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> VehicleResponse:
    try:
        vehicle = service.update_status(vehicle_id, payload.status)
    except ValueError as exc:
        if str(exc) == VEHICLE_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VEHICLE_NOT_FOUND) from exc
        if str(exc) == INVALID_STATUS_TRANSITION:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=INVALID_STATUS_TRANSITION) from exc
        raise
    return VehicleResponse.model_validate(vehicle)
