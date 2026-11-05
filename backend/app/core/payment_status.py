from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"
    RECUSADO = "RECUSADO"
    CANCELADO = "CANCELADO"


ALLOWED_PAYMENT_TRANSITIONS: dict[PaymentStatus, frozenset[PaymentStatus]] = {
    PaymentStatus.PENDENTE: frozenset(
        {
            PaymentStatus.APROVADO,
            PaymentStatus.RECUSADO,
            PaymentStatus.CANCELADO,
        }
    ),
    PaymentStatus.APROVADO: frozenset(),
    PaymentStatus.RECUSADO: frozenset(),
    PaymentStatus.CANCELADO: frozenset(),
}
