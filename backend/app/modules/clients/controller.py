from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.clients.repository import ClientRepository
from app.modules.clients.schemas import ClientCreateRequest, ClientResponse, ClientUpdateRequest
from app.modules.clients.service import (
    CLIENT_ACCESS_DENIED,
    CLIENT_ALREADY_LINKED,
    CLIENT_NOT_FOUND,
    DOCUMENT_ALREADY_REGISTERED,
    ClientService,
)

router = APIRouter(prefix="/api/clients", tags=["clients"])

ClientCreators = Annotated[
    Usuario,
    Depends(require_roles(UserRole.CLIENT, UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]
ClientListers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN)),
]


def get_client_repository(db: Session = Depends(get_db)) -> ClientRepository:
    return ClientRepository(db)


def get_client_service(
    repository: Annotated[ClientRepository, Depends(get_client_repository)],
) -> ClientService:
    return ClientService(repository)


def _handle_service_error(exc: ValueError) -> None:
    message = str(exc)
    if message == CLIENT_NOT_FOUND:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message) from exc
    if message in (CLIENT_ACCESS_DENIED,):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message) from exc
    if message in (DOCUMENT_ALREADY_REGISTERED, CLIENT_ALREADY_LINKED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message) from exc
    raise exc


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def register_client(
    payload: ClientCreateRequest,
    actor: ClientCreators,
    service: Annotated[ClientService, Depends(get_client_service)],
) -> ClientResponse:
    try:
        client = service.register_client(payload, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return ClientResponse.model_validate(client)


@router.get("", response_model=list[ClientResponse])
def list_clients(
    _: ClientListers,
    service: Annotated[ClientService, Depends(get_client_service)],
    search: str | None = Query(default=None, max_length=255),
) -> list[ClientResponse]:
    clients = service.list_clients(search=search)
    return [ClientResponse.model_validate(client) for client in clients]


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[ClientService, Depends(get_client_service)],
) -> ClientResponse:
    try:
        client = service.get_client(client_id, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return ClientResponse.model_validate(client)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    payload: ClientUpdateRequest,
    actor: Annotated[Usuario, Depends(get_current_user)],
    service: Annotated[ClientService, Depends(get_client_service)],
) -> ClientResponse:
    try:
        client = service.update_client(client_id, payload, actor)
    except ValueError as exc:
        _handle_service_error(exc)
        raise
    return ClientResponse.model_validate(client)
