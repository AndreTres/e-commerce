from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.simulacao_financiamento import SimulacaoFinanciamento
from app.models.cliente import Cliente
from app.models.veiculo import Veiculo


class FinancingRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_client(self, client_id: UUID) -> Cliente | None:
        return self._db.get(Cliente, client_id)

    def get_vehicle(self, vehicle_id: UUID) -> Veiculo | None:
        return self._db.get(Veiculo, vehicle_id)

    def get_by_id(self, simulation_id: UUID) -> SimulacaoFinanciamento | None:
        statement = (
            select(SimulacaoFinanciamento)
            .options(
                joinedload(SimulacaoFinanciamento.veiculo),
                joinedload(SimulacaoFinanciamento.cliente),
            )
            .where(SimulacaoFinanciamento.id == simulation_id)
        )
        return self._db.scalar(statement)

    def list_simulations(
        self,
        *,
        cliente_id: UUID | None = None,
        veiculo_id: UUID | None = None,
    ) -> list[SimulacaoFinanciamento]:
        statement = select(SimulacaoFinanciamento).options(
            joinedload(SimulacaoFinanciamento.veiculo),
            joinedload(SimulacaoFinanciamento.cliente),
        )
        if cliente_id is not None:
            statement = statement.where(SimulacaoFinanciamento.cliente_id == cliente_id)
        if veiculo_id is not None:
            statement = statement.where(SimulacaoFinanciamento.veiculo_id == veiculo_id)
        statement = statement.order_by(SimulacaoFinanciamento.data_simulacao.desc())
        return list(self._db.scalars(statement).unique().all())

    def create(self, simulation: SimulacaoFinanciamento) -> SimulacaoFinanciamento:
        self._db.add(simulation)
        self._db.commit()
        self._db.refresh(simulation)
        loaded = self.get_by_id(simulation.id)
        return loaded or simulation
