from decimal import Decimal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str
    jwt_secret_key: str
    jwt_expiration_minutes: int = 480
    financing_monthly_interest_rate: Decimal = Decimal("1.0")

    seed_client_email: str
    seed_client_password: str
    seed_seller_email: str
    seed_seller_password: str
    seed_manager_email: str
    seed_manager_password: str
    seed_finance_email: str
    seed_finance_password: str
    seed_admin_email: str
    seed_admin_password: str


settings = Settings()
