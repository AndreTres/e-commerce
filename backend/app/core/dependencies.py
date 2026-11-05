from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.core.security import decode_access_token
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.auth.repository import AuthRepository

_bearer_scheme = HTTPBearer(auto_error=False)

INVALID_CREDENTIALS_MESSAGE = "Could not validate credentials"


def get_auth_repository(db: Session = Depends(get_db)) -> AuthRepository:
    return AuthRepository(db)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    repository: Annotated[AuthRepository, Depends(get_auth_repository)],
) -> Usuario:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_MESSAGE,
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
        role = payload.get("role")
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=INVALID_CREDENTIALS_MESSAGE,
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (JWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_MESSAGE,
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = repository.get_by_id(user_id)
    if user is None or user.role != role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_MESSAGE,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(*allowed_roles: UserRole) -> Callable[..., Usuario]:
    allowed = frozenset(allowed_roles)

    def dependency(current_user: Annotated[Usuario, Depends(get_current_user)]) -> Usuario:
        if UserRole(current_user.role) not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency
