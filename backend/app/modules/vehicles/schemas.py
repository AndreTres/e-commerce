from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.vehicle_status import VehicleStatus

MIN_VEHICLE_YEAR = 1900


def max_vehicle_year() -> int:
    return datetime.now().year + 1


class VehicleResponse(BaseModel):
    id: UUID
    marca: str
    modelo: str
    ano: int
    cor: str
    quilometragem: int
    preco: Decimal
    status: VehicleStatus
    descricao: str

    model_config = {"from_attributes": True}


class VehicleCreateRequest(BaseModel):
    marca: str = Field(min_length=1, max_length=100)
    modelo: str = Field(min_length=1, max_length=100)
    ano: int = Field(ge=MIN_VEHICLE_YEAR, le=max_vehicle_year())
    cor: str = Field(min_length=1, max_length=100)
    quilometragem: int = Field(ge=0, le=9_999_999)
    preco: Decimal = Field(gt=0)
    descricao: str = Field(default="", max_length=2000)


class VehicleUpdateRequest(BaseModel):
    marca: str = Field(min_length=1, max_length=100)
    modelo: str = Field(min_length=1, max_length=100)
    ano: int = Field(ge=MIN_VEHICLE_YEAR, le=max_vehicle_year())
    cor: str = Field(min_length=1, max_length=100)
    quilometragem: int = Field(ge=0, le=9_999_999)
    preco: Decimal = Field(gt=0)
    descricao: str = Field(default="", max_length=2000)


class VehicleStatusUpdateRequest(BaseModel):
    status: VehicleStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value
