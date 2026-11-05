import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.documents import INVALID_DOCUMENT_MESSAGE, validate_cpf_or_cnpj

PHONE_PATTERN = re.compile(r"^[\d\s\(\)\+\-]{1,20}$")


class ClientCreateRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    cpf_cnpj: str = Field(min_length=1, max_length=18)
    email: EmailStr
    telefone: str = Field(min_length=1, max_length=20)
    endereco: str = Field(min_length=1, max_length=500)

    @field_validator("cpf_cnpj")
    @classmethod
    def validate_document(cls, value: str) -> str:
        try:
            return validate_cpf_or_cnpj(value)
        except ValueError as exc:
            if str(exc) == INVALID_DOCUMENT_MESSAGE:
                raise ValueError(INVALID_DOCUMENT_MESSAGE) from exc
            raise

    @field_validator("telefone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        stripped = value.strip()
        if not PHONE_PATTERN.fullmatch(stripped):
            raise ValueError("Invalid telephone format")
        return stripped


class ClientUpdateRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    cpf_cnpj: str = Field(min_length=1, max_length=18)
    email: EmailStr
    telefone: str = Field(min_length=1, max_length=20)
    endereco: str = Field(min_length=1, max_length=500)

    @field_validator("cpf_cnpj")
    @classmethod
    def validate_document(cls, value: str) -> str:
        try:
            return validate_cpf_or_cnpj(value)
        except ValueError as exc:
            if str(exc) == INVALID_DOCUMENT_MESSAGE:
                raise ValueError(INVALID_DOCUMENT_MESSAGE) from exc
            raise

    @field_validator("telefone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        stripped = value.strip()
        if not PHONE_PATTERN.fullmatch(stripped):
            raise ValueError("Invalid telephone format")
        return stripped


class ClientResponse(BaseModel):
    id: UUID
    nome: str
    cpf_cnpj: str
    email: EmailStr
    telefone: str
    endereco: str
    data_cadastro: datetime

    model_config = {"from_attributes": True}
