from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.payment_methods import PaymentMethod
from app.core.payment_status import PaymentStatus
from app.core.sale_status import SaleStatus


class PaymentCreateRequest(BaseModel):
    venda_id: UUID
    tipo: PaymentMethod
    valor: Decimal = Field(gt=0)
    observacoes: str | None = Field(default=None, max_length=2000)

    @field_validator("tipo", mode="before")
    @classmethod
    def normalize_type(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("observacoes")
    @classmethod
    def normalize_observations(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class PaymentStatusUpdateRequest(BaseModel):
    status: PaymentStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value


class PaymentSaleSummary(BaseModel):
    id: UUID
    status: SaleStatus
    valor_total: Decimal
    cliente_id: UUID
    veiculo_id: UUID

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: UUID
    venda_id: UUID
    tipo: PaymentMethod
    valor: Decimal
    data_pagamento: datetime
    status: PaymentStatus
    observacoes: str | None
    venda: PaymentSaleSummary

    model_config = {"from_attributes": True}


class FinanceSummaryResponse(BaseModel):
    total_payments: int
    approved_payments_value: Decimal
    pending_payments_value: Decimal
    rejected_payments_value: Decimal
    cancelled_payments_value: Decimal
