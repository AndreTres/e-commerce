from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(*, user_id: UUID, role: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expiration_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])

