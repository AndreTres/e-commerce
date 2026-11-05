from datetime import UTC, datetime
from uuid import UUID

from app.core.roles import UserRole
from app.core.test_drive_status import (
    ALLOWED_TEST_DRIVE_TRANSITIONS,
    FINAL_TEST_DRIVE_STATUSES,
    TestDriveStatus,
)
from app.core.vehicle_status import VehicleStatus
from app.models.test_drive import TestDrive
from app.models.usuario import Usuario
from app.models.veiculo import Veiculo
from app.modules.test_drives.repository import TestDriveRepository
from app.modules.test_drives.schemas import (
    TestDriveCreateRequest,
    TestDriveListFilters,
    TestDriveUpdateRequest,
)

TEST_DRIVE_NOT_FOUND = "Test drive appointment not found"
TEST_DRIVE_ACCESS_DENIED = "Access to this test drive appointment is not allowed"
CLIENT_NOT_FOUND = "Client not found"
VEHICLE_NOT_FOUND = "Vehicle not found"
VEHICLE_NOT_ELIGIBLE = "Vehicle is not eligible for test drive scheduling"
SCHEDULING_CONFLICT = "A confirmed test drive already exists for this vehicle and time"
INVALID_STATUS_TRANSITION = "Test drive status transition is not allowed"
CLIENT_PROFILE_REQUIRED = "Authenticated client account is not linked to a customer record"
CLIENT_ID_REQUIRED = "cliente_id is required for this operation"
APPOINTMENT_FINALIZED = "Final test drive appointments cannot be modified"


class TestDriveService:
    def __init__(self, repository: TestDriveRepository) -> None:
        self._repository = repository

    def schedule(self, payload: TestDriveCreateRequest, actor: Usuario) -> TestDrive:
        role = UserRole(actor.role)
        cliente_id = self._resolve_client_id(payload, actor, role)

        client = self._repository.get_client(cliente_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)

        vehicle = self._repository.get_vehicle(payload.veiculo_id)
        if vehicle is None:
            raise ValueError(VEHICLE_NOT_FOUND)
        self._ensure_vehicle_eligible(vehicle)

        appointment = TestDrive(
            cliente_id=cliente_id,
            veiculo_id=payload.veiculo_id,
            data_agendamento=payload.data_agendamento,
            status=TestDriveStatus.AGENDADO,
            observacoes=payload.observacoes,
        )
        return self._repository.create(appointment)

    def list_appointments(self, actor: Usuario, filters: TestDriveListFilters) -> list[TestDrive]:
        role = UserRole(actor.role)
        cliente_id = None
        veiculo_id = filters.veiculo_id

        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            cliente_id = actor.cliente_id
        elif role not in (UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN):
            raise ValueError(TEST_DRIVE_ACCESS_DENIED)

        return self._repository.list_appointments(
            cliente_id=cliente_id,
            status=filters.status,
            veiculo_id=veiculo_id,
            scheduled_date=filters.scheduled_date,
        )

    def get_appointment(self, appointment_id: UUID, actor: Usuario) -> TestDrive:
        appointment = self._repository.get_by_id(appointment_id)
        if appointment is None:
            raise ValueError(TEST_DRIVE_NOT_FOUND)
        self._ensure_can_access(appointment, actor)
        return appointment

    def update_appointment(
        self,
        appointment_id: UUID,
        payload: TestDriveUpdateRequest,
    ) -> TestDrive:
        appointment = self._repository.get_by_id(appointment_id)
        if appointment is None:
            raise ValueError(TEST_DRIVE_NOT_FOUND)
        if TestDriveStatus(appointment.status) in FINAL_TEST_DRIVE_STATUSES:
            raise ValueError(APPOINTMENT_FINALIZED)

        if self._repository.has_confirmed_conflict(
            veiculo_id=appointment.veiculo_id,
            data_agendamento=payload.data_agendamento,
            exclude_appointment_id=appointment.id,
        ):
            raise ValueError(SCHEDULING_CONFLICT)

        appointment.data_agendamento = payload.data_agendamento
        appointment.observacoes = payload.observacoes
        return self._repository.update(appointment)

    def update_status(self, appointment_id: UUID, new_status: TestDriveStatus) -> TestDrive:
        try:
            appointment = self._repository.get_by_id(appointment_id)
            if appointment is None:
                raise ValueError(TEST_DRIVE_NOT_FOUND)

            current_status = TestDriveStatus(appointment.status)
            if new_status not in ALLOWED_TEST_DRIVE_TRANSITIONS[current_status]:
                raise ValueError(INVALID_STATUS_TRANSITION)

            if new_status == TestDriveStatus.CONFIRMADO:
                vehicle = self._repository.get_vehicle(appointment.veiculo_id)
                if vehicle is None:
                    raise ValueError(VEHICLE_NOT_FOUND)
                self._ensure_vehicle_eligible(vehicle)
                if self._repository.has_confirmed_conflict(
                    veiculo_id=appointment.veiculo_id,
                    data_agendamento=appointment.data_agendamento,
                    exclude_appointment_id=appointment.id,
                ):
                    raise ValueError(SCHEDULING_CONFLICT)

            if new_status == TestDriveStatus.REALIZADO:
                appointment.data_realizacao = datetime.now(UTC)

            appointment.status = new_status
            return self._repository.update(appointment)
        except ValueError:
            self._repository.rollback()
            raise
        except Exception:
            self._repository.rollback()
            raise

    @staticmethod
    def _resolve_client_id(payload: TestDriveCreateRequest, actor: Usuario, role: UserRole) -> UUID:
        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            return actor.cliente_id
        if payload.cliente_id is None:
            raise ValueError(CLIENT_ID_REQUIRED)
        return payload.cliente_id

    @staticmethod
    def _ensure_vehicle_eligible(vehicle: Veiculo) -> None:
        if vehicle.status in (VehicleStatus.VENDIDO, VehicleStatus.INDISPONIVEL):
            raise ValueError(VEHICLE_NOT_ELIGIBLE)

    @staticmethod
    def _ensure_can_access(appointment: TestDrive, actor: Usuario) -> None:
        role = UserRole(actor.role)
        if role == UserRole.CLIENT:
            if actor.cliente_id != appointment.cliente_id:
                raise ValueError(TEST_DRIVE_ACCESS_DENIED)
            return
        if role in (UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN):
            return
        raise ValueError(TEST_DRIVE_ACCESS_DENIED)
