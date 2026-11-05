from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.notification_status import NotificationStatus
from app.core.notification_types import NotificationType
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import (
    NotificationCreateRequest,
    NotificationResponse,
    NotificationStatusUpdateRequest,
)
from app.modules.notifications.service import (
    CLIENT_NOT_FOUND,
    CLIENT_PROFILE_REQUIRED,
    INVALID_STATUS_TRANSITION,
    NOTIFICATION_ACCESS_DENIED,
    NOTIFICATION_NOT_FOUND,
    NotificationService,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

NotificationCreators = Annotated[
    Usuario,
    Depends(require_roles(UserRole.SELLER, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN)),
]
NotificationReaders = Annotated[
    Usuario,
    Depends(require_roles(UserRole.CLIENT, UserRole.ADMIN)),
]
NotificationStatusAdmins = Annotated[Usuario, Depends(require_roles(UserRole.ADMIN))]


def get_notification_repository(db: Session = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


def get_notification_service(
    repository: Annotated[NotificationRepository, Depends(get_notification_repository)],
) -> NotificationService:
    return NotificationService(repository)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    mapping = {
        NOTIFICATION_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        CLIENT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
        NOTIFICATION_ACCESS_DENIED: status.HTTP_403_FORBIDDEN,
        CLIENT_PROFILE_REQUIRED: status.HTTP_400_BAD_REQUEST,
        INVALID_STATUS_TRANSITION: status.HTTP_409_CONFLICT,
    }
    status_code = mapping.get(message, status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreateRequest,
    _: NotificationCreators,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationResponse:
    try:
        notification = service.create_notification(payload)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return NotificationResponse.model_validate(notification)


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    actor: NotificationReaders,
    service: Annotated[NotificationService, Depends(get_notification_service)],
    tipo: NotificationType | None = None,
    notification_status: NotificationStatus | None = Query(default=None, alias="status"),
) -> list[NotificationResponse]:
    try:
        notifications = service.list_notifications(
            actor,
            tipo=tipo,
            status=notification_status,
        )
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return [NotificationResponse.model_validate(item) for item in notifications]


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    actor: NotificationReaders,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationResponse:
    try:
        notification = service.get_notification(notification_id, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return NotificationResponse.model_validate(notification)


@router.patch("/{notification_id}/status", response_model=NotificationResponse)
def update_notification_status(
    notification_id: UUID,
    payload: NotificationStatusUpdateRequest,
    _: NotificationStatusAdmins,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationResponse:
    try:
        notification = service.update_status(notification_id, payload.status)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return NotificationResponse.model_validate(notification)
