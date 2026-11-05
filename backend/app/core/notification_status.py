from enum import StrEnum


class NotificationStatus(StrEnum):
    PENDENTE = "PENDENTE"
    ENVIADA = "ENVIADA"
    FALHOU = "FALHOU"


ALLOWED_NOTIFICATION_TRANSITIONS: dict[NotificationStatus, frozenset[NotificationStatus]] = {
    NotificationStatus.PENDENTE: frozenset({NotificationStatus.ENVIADA, NotificationStatus.FALHOU}),
    NotificationStatus.ENVIADA: frozenset(),
    NotificationStatus.FALHOU: frozenset(),
}
