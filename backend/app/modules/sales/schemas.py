from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.payment_methods import PaymentMethod
from app.core.sale_status import SaleStatus


class SaleCreateRequest(BaseModel):
    veiculo_id: UUID
    forma_pagamento: PaymentMethod
    observacoes: str | None = Field(default=None, max_length=2000)
    cliente_id: UUID | None = None

    @field_validator("forma_pagamento", mode="before")
    @classmethod
    def normalize_payment_method(cls, value: object) -> object:
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


class SaleStatusUpdateRequest(BaseModel):
    status: SaleStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value


class SaleClientSummary(BaseModel):
    id: UUID
    nome: str
    email: str

    model_config = {"from_attributes": True}


class SaleVehicleSummary(BaseModel):
    id: UUID
    marca: str
    modelo: str
    ano: int
    status: str
    preco: Decimal

    model_config = {"from_attributes": True}


class SaleResponse(BaseModel):
    id: UUID
    cliente_id: UUID
    veiculo_id: UUID
    data_venda: datetime
    valor_total: Decimal
    status: SaleStatus
    forma_pagamento: PaymentMethod
    observacoes: str | None
    cliente: SaleClientSummary
    veiculo: SaleVehicleSummary

    model_config = {"from_attributes": True}


class SaleListFilters(BaseModel):
    status: SaleStatus | None = None
    cliente_id: UUID | None = None
    veiculo_id: UUID | None = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @model_validator(mode="after")
    def validate_filter_combination(self) -> "SaleListFilters":
        return self
