from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.test_drive_status import TestDriveStatus


class TestDriveCreateRequest(BaseModel):
    veiculo_id: UUID
    data_agendamento: datetime
    observacoes: str | None = Field(default=None, max_length=2000)
    cliente_id: UUID | None = None

    @field_validator("observacoes")
    @classmethod
    def normalize_observations(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class TestDriveUpdateRequest(BaseModel):
    data_agendamento: datetime
    observacoes: str | None = Field(default=None, max_length=2000)

    @field_validator("observacoes")
    @classmethod
    def normalize_observations(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class TestDriveStatusUpdateRequest(BaseModel):
    status: TestDriveStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value


class TestDriveClientSummary(BaseModel):
    id: UUID
    nome: str
    email: str

    model_config = {"from_attributes": True}


class TestDriveVehicleSummary(BaseModel):
    id: UUID
    marca: str
    modelo: str
    ano: int
    status: str

    model_config = {"from_attributes": True}


class TestDriveResponse(BaseModel):
    id: UUID
    cliente_id: UUID
    veiculo_id: UUID
    data_agendamento: datetime
    data_realizacao: datetime | None
    status: TestDriveStatus
    observacoes: str | None
    cliente: TestDriveClientSummary
    veiculo: TestDriveVehicleSummary

    model_config = {"from_attributes": True}


class TestDriveListFilters(BaseModel):
    status: TestDriveStatus | None = None
    veiculo_id: UUID | None = None
    scheduled_date: date | None = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value
