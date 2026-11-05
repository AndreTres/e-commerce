import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.notification_status import (
    ALLOWED_NOTIFICATION_TRANSITIONS,
    NotificationStatus,
)
from app.core.notification_types import NotificationType
from app.core.roles import UserRole
from app.models.notificacao import Notificacao
from app.models.usuario import Usuario
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreateRequest

logger = logging.getLogger(__name__)

NOTIFICATION_NOT_FOUND = "Notification not found"
NOTIFICATION_ACCESS_DENIED = "Access to this notification is not allowed"
CLIENT_NOT_FOUND = "Client not found"
INVALID_STATUS_TRANSITION = "Notification status transition is not allowed"
CLIENT_PROFILE_REQUIRED = "Authenticated client account is not linked to a customer record"


class NotificationService:
    def __init__(self, repository: NotificationRepository) -> None:
        self._repository = repository

    def create_notification(self, payload: NotificationCreateRequest) -> Notificacao:
        return self.create_for_client(
            cliente_id=payload.cliente_id,
            tipo=payload.tipo,
            mensagem=payload.mensagem,
        )

    def create_for_client(
        self,
        *,
        cliente_id: UUID,
        tipo: NotificationType,
        mensagem: str,
    ) -> Notificacao:
        client = self._repository.get_client(cliente_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)

        notification = Notificacao(
            cliente_id=cliente_id,
            tipo=tipo,
            mensagem=mensagem.strip(),
            status=NotificationStatus.PENDENTE,
        )
        return self._repository.create(notification)

    def list_notifications(
        self,
        actor: Usuario,
        *,
        tipo: NotificationType | None = None,
        status: NotificationStatus | None = None,
    ) -> list[Notificacao]:
        role = UserRole(actor.role)
        cliente_id = None

        if role == UserRole.CLIENT:
            if actor.cliente_id is None:
                raise ValueError(CLIENT_PROFILE_REQUIRED)
            cliente_id = actor.cliente_id
        elif role == UserRole.ADMIN:
            pass
        else:
            raise ValueError(NOTIFICATION_ACCESS_DENIED)

        return self._repository.list_notifications(
            cliente_id=cliente_id,
            tipo=tipo,
            status=status,
        )

    def get_notification(self, notification_id: UUID, actor: Usuario) -> Notificacao:
        notification = self._repository.get_by_id(notification_id)
        if notification is None:
            raise ValueError(NOTIFICATION_NOT_FOUND)
        self._ensure_can_access(notification, actor)
        return notification

    def update_status(self, notification_id: UUID, new_status: NotificationStatus) -> Notificacao:
        notification = self._repository.get_by_id(notification_id)
        if notification is None:
            raise ValueError(NOTIFICATION_NOT_FOUND)

        current_status = NotificationStatus(notification.status)
        if new_status not in ALLOWED_NOTIFICATION_TRANSITIONS[current_status]:
            raise ValueError(INVALID_STATUS_TRANSITION)

        notification.status = new_status
        return self._repository.update_status(notification)

    @staticmethod
    def _ensure_can_access(notification: Notificacao, actor: Usuario) -> None:
        role = UserRole(actor.role)
        if role == UserRole.CLIENT:
            if actor.cliente_id != notification.cliente_id:
                raise ValueError(NOTIFICATION_ACCESS_DENIED)
            return
        if role == UserRole.ADMIN:
            return
        raise ValueError(NOTIFICATION_ACCESS_DENIED)


def try_create_notification(
    db: Session,
    *,
    cliente_id: UUID,
    tipo: NotificationType,
    mensagem: str,
) -> None:
    """Create a notification without affecting the caller's primary operation."""
    try:
        service = NotificationService(NotificationRepository(db))
        service.create_for_client(cliente_id=cliente_id, tipo=tipo, mensagem=mensagem)
    except Exception:
        logger.exception("Failed to create notification for client %s", cliente_id)
