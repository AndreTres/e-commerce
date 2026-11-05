from enum import StrEnum


class PaymentMethod(StrEnum):
    DINHEIRO = "DINHEIRO"
    PIX = "PIX"
    CARTAO = "CARTAO"
    TRANSFERENCIA = "TRANSFERENCIA"
    FINANCIAMENTO = "FINANCIAMENTO"
