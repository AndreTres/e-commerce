from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, cast, select
from sqlalchemy.orm import Session, joinedload

from app.core.test_drive_status import TestDriveStatus
from app.models.cliente import Cliente
from app.models.test_drive import TestDrive
from app.models.veiculo import Veiculo


class TestDriveRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, appointment_id: UUID) -> TestDrive | None:
        statement = (
            select(TestDrive)
            .options(joinedload(TestDrive.cliente), joinedload(TestDrive.veiculo))
            .where(TestDrive.id == appointment_id)
        )
        return self._db.scalar(statement)

    def get_client(self, client_id: UUID) -> Cliente | None:
        return self._db.get(Cliente, client_id)

    def get_vehicle(self, vehicle_id: UUID) -> Veiculo | None:
        return self._db.get(Veiculo, vehicle_id)

    def has_confirmed_conflict(
        self,
        *,
        veiculo_id: UUID,
        data_agendamento: datetime,
        exclude_appointment_id: UUID | None = None,
    ) -> bool:
        statement = select(TestDrive.id).where(
            TestDrive.veiculo_id == veiculo_id,
            TestDrive.data_agendamento == data_agendamento,
            TestDrive.status == TestDriveStatus.CONFIRMADO,
        )
        if exclude_appointment_id is not None:
            statement = statement.where(TestDrive.id != exclude_appointment_id)
        return self._db.scalar(statement) is not None

    def list_appointments(
        self,
        *,
        cliente_id: UUID | None = None,
        status: TestDriveStatus | None = None,
        veiculo_id: UUID | None = None,
        scheduled_date: date | None = None,
    ) -> list[TestDrive]:
        statement = select(TestDrive).options(
            joinedload(TestDrive.cliente),
            joinedload(TestDrive.veiculo),
        )
        if cliente_id is not None:
            statement = statement.where(TestDrive.cliente_id == cliente_id)
        if status is not None:
            statement = statement.where(TestDrive.status == status)
        if veiculo_id is not None:
            statement = statement.where(TestDrive.veiculo_id == veiculo_id)
        if scheduled_date is not None:
            statement = statement.where(cast(TestDrive.data_agendamento, Date) == scheduled_date)
        statement = statement.order_by(TestDrive.data_agendamento.desc())
        return list(self._db.scalars(statement).unique().all())

    def create(self, appointment: TestDrive) -> TestDrive:
        self._db.add(appointment)
        self._db.commit()
        self._db.refresh(appointment)
        loaded = self.get_by_id(appointment.id)
        return loaded or appointment

    def update(self, appointment: TestDrive) -> TestDrive:
        self._db.commit()
        self._db.refresh(appointment)
        loaded = self.get_by_id(appointment.id)
        return loaded or appointment

    def rollback(self) -> None:
        self._db.rollback()
