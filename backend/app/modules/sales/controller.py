from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.core.sale_status import SaleStatus
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.sales.repository import SaleRepository
from app.modules.sales.schemas import (
    SaleCreateRequest,
    SaleListFilters,
    SaleResponse,
    SaleStatusUpdateRequest,
)
from app.modules.sales.service import (
    CLIENT_ID_REQUIRED,
    CLIENT_NOT_FOUND,
    CLIENT_PROFILE_REQUIRED,
    INVALID_STATUS_TRANSITION,
    SALE_ACCESS_DENIED,
    SALE_NOT_FOUND,
    VEHICLE_ALREADY_SOLD,
    VEHICLE_NOT_AVAILABLE,
    VEHICLE_NOT_FOUND,
    SaleService,
)

router = APIRouter(prefix="/api/sales", tags=["sales"])

SaleCreators = Annotated[
    Usuario,
    Depends(require_roles(UserRole.CLIENT, UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]
SaleStatusManagers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]


def get_sale_repository(db: Session = Depends(get_db)) -> SaleRepository:
    return SaleRepository(db)


def get_sale_service(
    repository: Annotated[SaleRepository, Depends(get_sale_repository)],
) -> SaleService:
    return SaleService(repository)


def _to_sale_response(sale) -> SaleResponse:
    return SaleResponse.model_validate(sale)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    mapping = {
        SALE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        CLIENT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        VEHICLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        SALE_ACCESS_DENIED: status.HTTP_403_FORBIDDEN,
        CLIENT_PROFILE_REQUIRED: status.HTTP_400_BAD_REQUEST,
        CLIENT_ID_REQUIRED: status.HTTP_422_UNPROCESSABLE_ENTITY,
        VEHICLE_NOT_AVAILABLE: status.HTTP_409_CONFLICT,
        VEHICLE_ALREADY_SOLD: status.HTTP_409_CONFLICT,
        INVALID_STATUS_TRANSITION: status.HTTP_409_CONFLICT,
    }
    status_code = mapping.get(message, status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def register_sale(
    payload: SaleCreateRequest,
    actor: SaleCreators,
    service: Annotated[SaleService, Depends(get_sale_service)],
) -> SaleResponse:
    try:
        sale = service.register_sale(payload, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return _to_sale_response(sale)


@router.get("", response_model=list[SaleResponse])
def list_sales(
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[SaleService, Depends(get_sale_service)],
    sale_status: SaleStatus | None = Query(default=None, alias="status"),
    cliente_id: UUID | None = None,
    veiculo_id: UUID | None = None,
) -> list[SaleResponse]:
    filters = SaleListFilters(status=sale_status, cliente_id=cliente_id, veiculo_id=veiculo_id)
    try:
        sales = service.list_sales(actor, filters)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return [_to_sale_response(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: UUID,
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[SaleService, Depends(get_sale_service)],
) -> SaleResponse:
    try:
        sale = service.get_sale(sale_id, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return _to_sale_response(sale)


@router.patch("/{sale_id}/status", response_model=SaleResponse)
def update_sale_status(
    sale_id: UUID,
    payload: SaleStatusUpdateRequest,
    _: SaleStatusManagers,
    service: Annotated[SaleService, Depends(get_sale_service)],
) -> SaleResponse:
    try:
        sale = service.update_status(sale_id, payload.status)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return _to_sale_response(sale)
