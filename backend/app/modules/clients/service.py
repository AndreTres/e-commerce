from uuid import UUID

from app.core.roles import UserRole
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.modules.clients.repository import ClientRepository
from app.modules.clients.schemas import ClientCreateRequest, ClientUpdateRequest

CLIENT_NOT_FOUND = "Client not found"
CLIENT_ACCESS_DENIED = "Access to this client record is not allowed"
DOCUMENT_ALREADY_REGISTERED = "CPF or CNPJ is already registered"
CLIENT_ALREADY_LINKED = "Customer profile is already linked to this account"


class ClientService:
    def __init__(self, repository: ClientRepository) -> None:
        self._repository = repository

    def register_client(self, payload: ClientCreateRequest, actor: Usuario) -> Cliente:
        if UserRole(actor.role) == UserRole.CLIENT and actor.cliente_id is not None:
            raise ValueError(CLIENT_ALREADY_LINKED)

        if self._repository.get_by_cpf_cnpj(payload.cpf_cnpj) is not None:
            raise ValueError(DOCUMENT_ALREADY_REGISTERED)

        client = Cliente(
            nome=payload.nome.strip(),
            cpf_cnpj=payload.cpf_cnpj,
            email=str(payload.email).strip(),
            telefone=payload.telefone.strip(),
            endereco=payload.endereco.strip(),
        )
        created = self._repository.create(client)

        if UserRole(actor.role) == UserRole.CLIENT:
            self._repository.link_client_to_user(actor, created.id)

        return created

    def list_clients(self, search: str | None = None) -> list[Cliente]:
        return self._repository.list_clients(search=search)

    def get_client(self, client_id: UUID, actor: Usuario) -> Cliente:
        client = self._repository.get_by_id(client_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)
        self._ensure_can_access(client_id, actor)
        return client

    def update_client(
        self,
        client_id: UUID,
        payload: ClientUpdateRequest,
        actor: Usuario,
    ) -> Cliente:
        client = self._repository.get_by_id(client_id)
        if client is None:
            raise ValueError(CLIENT_NOT_FOUND)
        self._ensure_can_access(client_id, actor)

        existing = self._repository.get_by_cpf_cnpj(payload.cpf_cnpj)
        if existing is not None and existing.id != client.id:
            raise ValueError(DOCUMENT_ALREADY_REGISTERED)

        client.nome = payload.nome.strip()
        client.cpf_cnpj = payload.cpf_cnpj
        client.email = str(payload.email).strip()
        client.telefone = payload.telefone.strip()
        client.endereco = payload.endereco.strip()
        return self._repository.update(client)

    def _ensure_can_access(self, client_id: UUID, actor: Usuario) -> None:
        role = UserRole(actor.role)
        if role == UserRole.CLIENT:
            if actor.cliente_id != client_id:
                raise ValueError(CLIENT_ACCESS_DENIED)
            return

        if role in (UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN):
            return

        raise ValueError(CLIENT_ACCESS_DENIED)
