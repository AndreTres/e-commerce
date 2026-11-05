from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.notification_status import NotificationStatus
from app.core.notification_types import NotificationType
from app.models.cliente import Cliente
from app.models.notificacao import Notificacao


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_client(self, client_id: UUID) -> Cliente | None:
        return self._db.get(Cliente, client_id)

    def get_by_id(self, notification_id: UUID) -> Notificacao | None:
        return self._db.get(Notificacao, notification_id)

    def list_notifications(
        self,
        *,
        cliente_id: UUID | None = None,
        tipo: NotificationType | None = None,
        status: NotificationStatus | None = None,
    ) -> list[Notificacao]:
        statement = select(Notificacao)
        if cliente_id is not None:
            statement = statement.where(Notificacao.cliente_id == cliente_id)
        if tipo is not None:
            statement = statement.where(Notificacao.tipo == tipo)
        if status is not None:
            statement = statement.where(Notificacao.status == status)
        statement = statement.order_by(Notificacao.data_envio.desc())
        return list(self._db.scalars(statement).all())

    def create(self, notification: Notificacao) -> Notificacao:
        self._db.add(notification)
        self._db.commit()
        self._db.refresh(notification)
        return notification

    def update_status(self, notification: Notificacao) -> Notificacao:
        self._db.commit()
        self._db.refresh(notification)
        return notification
