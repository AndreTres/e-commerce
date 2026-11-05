from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.payment_status import PaymentStatus
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.finance.repository import FinanceRepository
from app.modules.finance.schemas import (
    FinanceSummaryResponse,
    PaymentCreateRequest,
    PaymentResponse,
    PaymentStatusUpdateRequest,
)
from app.modules.finance.service import (
    INVALID_STATUS_TRANSITION,
    PAYMENT_NOT_FOUND,
    SALE_CANCELLED,
    SALE_NOT_FOUND,
    FinanceService,
)

router = APIRouter(prefix="/api/finance", tags=["finance"])

FinanceUsers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.FINANCE, UserRole.ADMIN)),
]


def get_finance_repository(db: Session = Depends(get_db)) -> FinanceRepository:
    return FinanceRepository(db)


def get_finance_service(
    repository: Annotated[FinanceRepository, Depends(get_finance_repository)],
) -> FinanceService:
    return FinanceService(repository)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    mapping = {
        PAYMENT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        SALE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        SALE_CANCELLED: status.HTTP_409_CONFLICT,
        INVALID_STATUS_TRANSITION: status.HTTP_409_CONFLICT,
        "start_date must be less than or equal to end_date": status.HTTP_422_UNPROCESSABLE_ENTITY,
    }
    status_code = mapping.get(message, status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def register_payment(
    payload: PaymentCreateRequest,
    _: FinanceUsers,
    service: Annotated[FinanceService, Depends(get_finance_service)],
) -> PaymentResponse:
    try:
        payment = service.register_payment(payload)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return PaymentResponse.model_validate(payment)


@router.get("/payments", response_model=list[PaymentResponse])
def list_payments(
    _: FinanceUsers,
    service: Annotated[FinanceService, Depends(get_finance_service)],
    payment_status: PaymentStatus | None = Query(default=None, alias="status"),
    venda_id: UUID | None = None,
) -> list[PaymentResponse]:
    payments = service.list_payments(status=payment_status, venda_id=venda_id)
    return [PaymentResponse.model_validate(payment) for payment in payments]


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: UUID,
    _: FinanceUsers,
    service: Annotated[FinanceService, Depends(get_finance_service)],
) -> PaymentResponse:
    try:
        payment = service.get_payment(payment_id)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return PaymentResponse.model_validate(payment)


@router.patch("/payments/{payment_id}/status", response_model=PaymentResponse)
def update_payment_status(
    payment_id: UUID,
    payload: PaymentStatusUpdateRequest,
    _: FinanceUsers,
    service: Annotated[FinanceService, Depends(get_finance_service)],
) -> PaymentResponse:
    try:
        payment = service.update_payment_status(payment_id, payload.status)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return PaymentResponse.model_validate(payment)


@router.get("/summary", response_model=FinanceSummaryResponse)
def get_finance_summary(
    _: FinanceUsers,
    service: Annotated[FinanceService, Depends(get_finance_service)],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> FinanceSummaryResponse:
    try:
        return service.get_summary(start_date=start_date, end_date=end_date)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
