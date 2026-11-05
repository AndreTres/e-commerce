from enum import StrEnum


class VehicleStatus(StrEnum):
    DISPONIVEL = "DISPONIVEL"
    RESERVADO = "RESERVADO"
    VENDIDO = "VENDIDO"
    INDISPONIVEL = "INDISPONIVEL"
