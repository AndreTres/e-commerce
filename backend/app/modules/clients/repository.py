from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.models.usuario import Usuario


class ClientRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, client_id: UUID) -> Cliente | None:
        return self._db.get(Cliente, client_id)

    def get_by_cpf_cnpj(self, cpf_cnpj: str) -> Cliente | None:
        statement = select(Cliente).where(Cliente.cpf_cnpj == cpf_cnpj)
        return self._db.scalar(statement)

    def list_clients(self, search: str | None = None) -> list[Cliente]:
        statement = select(Cliente)
        if search:
            normalized = "".join(ch for ch in search if ch.isdigit())
            conditions = [
                Cliente.nome.ilike(f"%{search}%"),
                Cliente.email.ilike(f"%{search}%"),
            ]
            if normalized:
                conditions.append(Cliente.cpf_cnpj.ilike(f"%{normalized}%"))
            statement = statement.where(or_(*conditions))
        statement = statement.order_by(Cliente.nome, Cliente.data_cadastro.desc())
        return list(self._db.scalars(statement).all())

    def create(self, client: Cliente) -> Cliente:
        self._db.add(client)
        self._db.commit()
        self._db.refresh(client)
        return client

    def update(self, client: Cliente) -> Cliente:
        self._db.commit()
        self._db.refresh(client)
        return client

    def link_client_to_user(self, user: Usuario, client_id: UUID) -> None:
        user.cliente_id = client_id
        self._db.commit()
        self._db.refresh(user)
