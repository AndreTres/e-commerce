from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.payment_status import PaymentStatus
from app.models.pagamento import Pagamento
from app.models.venda import Venda
from app.modules.finance.schemas import FinanceSummaryResponse
from app.modules.finance.summary import build_finance_summary


class FinanceRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_sale(self, sale_id: UUID) -> Venda | None:
        return self._db.get(Venda, sale_id)

    def get_payment_by_id(self, payment_id: UUID) -> Pagamento | None:
        statement = (
            select(Pagamento)
            .options(joinedload(Pagamento.venda))
            .where(Pagamento.id == payment_id)
        )
        return self._db.scalar(statement)

    def list_payments(
        self,
        *,
        status: PaymentStatus | None = None,
        venda_id: UUID | None = None,
    ) -> list[Pagamento]:
        statement = select(Pagamento).options(joinedload(Pagamento.venda))
        if status is not None:
            statement = statement.where(Pagamento.status == status)
        if venda_id is not None:
            statement = statement.where(Pagamento.venda_id == venda_id)
        statement = statement.order_by(Pagamento.data_pagamento.desc())
        return list(self._db.scalars(statement).unique().all())

    def create_payment(
        self,
        *,
        venda_id: UUID,
        tipo: str,
        valor: Decimal,
        observacoes: str | None,
    ) -> Pagamento:
        payment = Pagamento(
            venda_id=venda_id,
            tipo=tipo,
            valor=valor,
            status=PaymentStatus.PENDENTE,
            observacoes=observacoes,
        )
        self._db.add(payment)
        self._db.commit()
        self._db.refresh(payment)
        loaded = self.get_payment_by_id(payment.id)
        return loaded or payment

    def update_payment_status(self, payment: Pagamento) -> Pagamento:
        self._db.commit()
        self._db.refresh(payment)
        loaded = self.get_payment_by_id(payment.id)
        return loaded or payment

    def get_summary(
        self,
        *,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> FinanceSummaryResponse:
        return build_finance_summary(
            self._db,
            start_date=start_date,
            end_date=end_date,
        )
