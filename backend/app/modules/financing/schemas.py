from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, computed_field

from app.core.financing_calculator import calculate_financed_amount


class SimulationCreateRequest(BaseModel):
    veiculo_id: UUID
    valor_entrada: Decimal = Field(ge=0)
    prazo_meses: int = Field(ge=1, le=120)
    cliente_id: UUID | None = None


class SimulationVehicleSummary(BaseModel):
    id: UUID
    marca: str
    modelo: str
    ano: int
    preco: Decimal

    model_config = {"from_attributes": True}


class SimulationResponse(BaseModel):
    id: UUID
    cliente_id: UUID
    veiculo_id: UUID
    valor_veiculo: Decimal
    valor_entrada: Decimal
    prazo_meses: int
    taxa_juros: Decimal
    valor_parcela: Decimal
    data_simulacao: datetime
    veiculo: SimulationVehicleSummary

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def valor_financiado(self) -> Decimal:
        return calculate_financed_amount(self.valor_veiculo, self.valor_entrada)
