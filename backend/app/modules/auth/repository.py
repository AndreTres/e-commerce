from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_email(self, email: str) -> Usuario | None:
        statement = select(Usuario).where(Usuario.email == email)
        return self._db.scalar(statement)

    def get_by_id(self, user_id: UUID) -> Usuario | None:
        statement = select(Usuario).where(Usuario.id == user_id)
        return self._db.scalar(statement)
