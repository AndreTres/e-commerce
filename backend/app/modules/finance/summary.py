from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.payment_status import PaymentStatus
from app.models.pagamento import Pagamento
from app.modules.finance.schemas import FinanceSummaryResponse


def build_finance_summary(
    db: Session,
    *,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> FinanceSummaryResponse:
    statement = select(
        Pagamento.status,
        func.count(Pagamento.id),
        func.coalesce(func.sum(Pagamento.valor), 0),
    )
    if start_date is not None:
        statement = statement.where(Pagamento.data_pagamento >= start_date)
    if end_date is not None:
        statement = statement.where(Pagamento.data_pagamento <= end_date)
    statement = statement.group_by(Pagamento.status)

    totals_by_status: dict[str, tuple[int, Decimal]] = {}
    for status, count, amount in db.execute(statement):
        totals_by_status[str(status)] = (int(count), Decimal(amount))

    def amount_for(status: PaymentStatus) -> Decimal:
        return totals_by_status.get(status, (0, Decimal("0.00")))[1]

    def count_for(status: PaymentStatus) -> int:
        return totals_by_status.get(status, (0, Decimal("0.00")))[0]

    total_payments = sum(count_for(status) for status in PaymentStatus)

    return FinanceSummaryResponse(
        total_payments=total_payments,
        approved_payments_value=amount_for(PaymentStatus.APROVADO),
        pending_payments_value=amount_for(PaymentStatus.PENDENTE),
        rejected_payments_value=amount_for(PaymentStatus.RECUSADO),
        cancelled_payments_value=amount_for(PaymentStatus.CANCELADO),
    )
