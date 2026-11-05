from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.core.test_drive_status import TestDriveStatus
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.test_drives.repository import TestDriveRepository
from app.modules.test_drives.schemas import (
    TestDriveCreateRequest,
    TestDriveListFilters,
    TestDriveResponse,
    TestDriveStatusUpdateRequest,
    TestDriveUpdateRequest,
)
from app.modules.test_drives.service import (
    APPOINTMENT_FINALIZED,
    CLIENT_ID_REQUIRED,
    CLIENT_NOT_FOUND,
    CLIENT_PROFILE_REQUIRED,
    INVALID_STATUS_TRANSITION,
    SCHEDULING_CONFLICT,
    TEST_DRIVE_ACCESS_DENIED,
    TEST_DRIVE_NOT_FOUND,
    VEHICLE_NOT_ELIGIBLE,
    VEHICLE_NOT_FOUND,
    TestDriveService,
)

router = APIRouter(prefix="/api/test-drives", tags=["test-drives"])

TestDriveSchedulers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.CLIENT, UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]
TestDriveManagers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]


def get_test_drive_repository(db: Session = Depends(get_db)) -> TestDriveRepository:
    return TestDriveRepository(db)


def get_test_drive_service(
    repository: Annotated[TestDriveRepository, Depends(get_test_drive_repository)],
) -> TestDriveService:
    return TestDriveService(repository)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    mapping = {
        TEST_DRIVE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        CLIENT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        VEHICLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        TEST_DRIVE_ACCESS_DENIED: status.HTTP_403_FORBIDDEN,
        CLIENT_PROFILE_REQUIRED: status.HTTP_400_BAD_REQUEST,
        CLIENT_ID_REQUIRED: status.HTTP_422_UNPROCESSABLE_ENTITY,
        VEHICLE_NOT_ELIGIBLE: status.HTTP_409_CONFLICT,
        SCHEDULING_CONFLICT: status.HTTP_409_CONFLICT,
        INVALID_STATUS_TRANSITION: status.HTTP_409_CONFLICT,
        APPOINTMENT_FINALIZED: status.HTTP_409_CONFLICT,
    }
    status_code = mapping.get(message, status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("", response_model=TestDriveResponse, status_code=status.HTTP_201_CREATED)
def schedule_test_drive(
    payload: TestDriveCreateRequest,
    actor: TestDriveSchedulers,
    service: Annotated[TestDriveService, Depends(get_test_drive_service)],
) -> TestDriveResponse:
    try:
        appointment = service.schedule(payload, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return TestDriveResponse.model_validate(appointment)


@router.get("", response_model=list[TestDriveResponse])
def list_test_drives(
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[TestDriveService, Depends(get_test_drive_service)],
    appointment_status: TestDriveStatus | None = Query(default=None, alias="status"),
    veiculo_id: UUID | None = None,
    scheduled_date: date | None = None,
) -> list[TestDriveResponse]:
    filters = TestDriveListFilters(
        status=appointment_status,
        veiculo_id=veiculo_id,
        scheduled_date=scheduled_date,
    )
    try:
        appointments = service.list_appointments(actor, filters)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return [TestDriveResponse.model_validate(item) for item in appointments]


@router.get("/{test_drive_id}", response_model=TestDriveResponse)
def get_test_drive(
    test_drive_id: UUID,
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[TestDriveService, Depends(get_test_drive_service)],
) -> TestDriveResponse:
    try:
        appointment = service.get_appointment(test_drive_id, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return TestDriveResponse.model_validate(appointment)


@router.put("/{test_drive_id}", response_model=TestDriveResponse)
def update_test_drive(
    test_drive_id: UUID,
    payload: TestDriveUpdateRequest,
    _: TestDriveManagers,
    service: Annotated[TestDriveService, Depends(get_test_drive_service)],
) -> TestDriveResponse:
    try:
        appointment = service.update_appointment(test_drive_id, payload)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return TestDriveResponse.model_validate(appointment)


@router.patch("/{test_drive_id}/status", response_model=TestDriveResponse)
def update_test_drive_status(
    test_drive_id: UUID,
    payload: TestDriveStatusUpdateRequest,
    _: TestDriveManagers,
    service: Annotated[TestDriveService, Depends(get_test_drive_service)],
) -> TestDriveResponse:
    try:
        appointment = service.update_status(test_drive_id, payload.status)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return TestDriveResponse.model_validate(appointment)
