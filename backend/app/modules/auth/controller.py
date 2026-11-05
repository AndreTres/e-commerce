from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_auth_repository, get_current_user
from app.models.usuario import Usuario
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import CurrentUserResponse, LoginRequest, TokenResponse
from app.modules.auth.service import AuthService, INVALID_LOGIN_MESSAGE

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(
    repository: Annotated[AuthRepository, Depends(get_auth_repository)],
) -> AuthService:
    return AuthService(repository)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    try:
        access_token = service.login(payload.email, payload.password)
    except ValueError as exc:
        if str(exc) == INVALID_LOGIN_MESSAGE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=INVALID_LOGIN_MESSAGE,
            ) from exc
        raise
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: Annotated[Usuario, Depends(get_current_user)]) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
    )
