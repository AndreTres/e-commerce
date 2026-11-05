from enum import StrEnum


class TestDriveStatus(StrEnum):
    AGENDADO = "AGENDADO"
    CONFIRMADO = "CONFIRMADO"
    REALIZADO = "REALIZADO"
    CANCELADO = "CANCELADO"
    NAO_COMPARECEU = "NAO_COMPARECEU"


FINAL_TEST_DRIVE_STATUSES = frozenset(
    {
        TestDriveStatus.REALIZADO,
        TestDriveStatus.CANCELADO,
        TestDriveStatus.NAO_COMPARECEU,
    }
)

ALLOWED_TEST_DRIVE_TRANSITIONS: dict[TestDriveStatus, frozenset[TestDriveStatus]] = {
    TestDriveStatus.AGENDADO: frozenset({TestDriveStatus.CONFIRMADO, TestDriveStatus.CANCELADO}),
    TestDriveStatus.CONFIRMADO: frozenset(
        {
            TestDriveStatus.REALIZADO,
            TestDriveStatus.CANCELADO,
            TestDriveStatus.NAO_COMPARECEU,
        }
    ),
    TestDriveStatus.REALIZADO: frozenset(),
    TestDriveStatus.CANCELADO: frozenset(),
    TestDriveStatus.NAO_COMPARECEU: frozenset(),
}
