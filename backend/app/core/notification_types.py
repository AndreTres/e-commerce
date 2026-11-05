from enum import StrEnum


class NotificationType(StrEnum):
    VENDA = "VENDA"
    PAGAMENTO = "PAGAMENTO"
    TEST_DRIVE = "TEST_DRIVE"
    FINANCIAMENTO = "FINANCIAMENTO"
    GERAL = "GERAL"
