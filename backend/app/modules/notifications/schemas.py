from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.notification_status import NotificationStatus
from app.core.notification_types import NotificationType


class NotificationCreateRequest(BaseModel):
    cliente_id: UUID
    tipo: NotificationType
    mensagem: str = Field(min_length=1, max_length=1000)

    @field_validator("tipo", mode="before")
    @classmethod
    def normalize_type(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("mensagem")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        return value.strip()


class NotificationStatusUpdateRequest(BaseModel):
    status: NotificationStatus

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().upper()
        return value


class NotificationResponse(BaseModel):
    id: UUID
    cliente_id: UUID
    tipo: NotificationType
    mensagem: str
    data_envio: datetime
    status: NotificationStatus

    model_config = {"from_attributes": True}
