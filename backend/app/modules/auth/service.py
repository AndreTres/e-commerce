from app.core.security import create_access_token, verify_password
from app.models.usuario import Usuario
from app.modules.auth.repository import AuthRepository

INVALID_LOGIN_MESSAGE = "Invalid email or password"


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    def login(self, email: str, password: str) -> str:
        user = self._repository.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise ValueError(INVALID_LOGIN_MESSAGE)

        return create_access_token(user_id=user.id, role=user.role)

    def get_current_user_info(self, user: Usuario) -> Usuario:
        return user
