from enum import StrEnum


class SaleStatus(StrEnum):
    PENDENTE = "PENDENTE"
    EM_PROCESSAMENTO = "EM_PROCESSAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


ACTIVE_SALE_STATUSES = frozenset({SaleStatus.PENDENTE, SaleStatus.EM_PROCESSAMENTO})

ALLOWED_SALE_TRANSITIONS: dict[SaleStatus, frozenset[SaleStatus]] = {
    SaleStatus.PENDENTE: frozenset({SaleStatus.EM_PROCESSAMENTO, SaleStatus.CANCELADA}),
    SaleStatus.EM_PROCESSAMENTO: frozenset({SaleStatus.CONCLUIDA, SaleStatus.CANCELADA}),
    SaleStatus.CONCLUIDA: frozenset(),
    SaleStatus.CANCELADA: frozenset(),
}
