"""Idempotent seed for predefined system accounts."""

from sqlalchemy import select

from app.core.config import settings
from app.core.roles import UserRole
from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.models.cliente import Cliente
from app.models.colaborador import Colaborador
from app.models.usuario import Usuario

SEED_CLIENT_CPF = "39053344705"


def _user_exists(db, email: str) -> bool:
    return db.scalar(select(Usuario.id).where(Usuario.email == email)) is not None


def _seed_client(db) -> None:
    email = settings.seed_client_email
    if _user_exists(db, email):
        return

    cliente = Cliente(
        nome="Seed Client User",
        cpf_cnpj=SEED_CLIENT_CPF,
        email=email,
        telefone="11999990001",
        endereco="Seed Address 1",
    )
    db.add(cliente)
    db.flush()

    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(settings.seed_client_password),
            role=UserRole.CLIENT,
            cliente_id=cliente.id,
        )
    )


def _seed_employee(
    db,
    *,
    email: str,
    password: str,
    role: UserRole,
    nome: str,
    cargo: str,
    telefone: str,
) -> None:
    if _user_exists(db, email):
        return

    colaborador = Colaborador(
        nome=nome,
        email=email,
        telefone=telefone,
        cargo=cargo,
        ativo=True,
    )
    db.add(colaborador)
    db.flush()

    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(password),
            role=role,
            colaborador_id=colaborador.id,
        )
    )


def run_seed() -> None:
    db = SessionLocal()
    try:
        _seed_client(db)
        _seed_employee(
            db,
            email=settings.seed_seller_email,
            password=settings.seed_seller_password,
            role=UserRole.SELLER,
            nome="Seed Seller",
            cargo="SELLER",
            telefone="11999990002",
        )
        _seed_employee(
            db,
            email=settings.seed_manager_email,
            password=settings.seed_manager_password,
            role=UserRole.MANAGER,
            nome="Seed Manager",
            cargo="MANAGER",
            telefone="11999990003",
        )
        _seed_employee(
            db,
            email=settings.seed_finance_email,
            password=settings.seed_finance_password,
            role=UserRole.FINANCE,
            nome="Seed Finance",
            cargo="FINANCE",
            telefone="11999990004",
        )
        _seed_employee(
            db,
            email=settings.seed_admin_email,
            password=settings.seed_admin_password,
            role=UserRole.ADMIN,
            nome="Seed Admin",
            cargo="ADMIN",
            telefone="11999990005",
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
    print("Seed completed.")
