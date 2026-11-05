from enum import StrEnum


class UserRole(StrEnum):
    CLIENT = "CLIENT"
    SELLER = "SELLER"
    MANAGER = "MANAGER"
    FINANCE = "FINANCE"
    ADMIN = "ADMIN"


EMPLOYEE_ROLES = frozenset(
    {
        UserRole.SELLER,
        UserRole.MANAGER,
        UserRole.FINANCE,
        UserRole.ADMIN,
    }
)
