from datetime import datetime
from uuid import UUID

from app.core.payment_status import ALLOWED_PAYMENT_TRANSITIONS, PaymentStatus
from app.core.sale_status import SaleStatus
from app.models.pagamento import Pagamento
from app.modules.finance.repository import FinanceRepository
from app.modules.finance.schemas import FinanceSummaryResponse, PaymentCreateRequest
PAYMENT_NOT_FOUND = "Payment not found"
SALE_NOT_FOUND = "Sale not found"
SALE_CANCELLED = "Cancelled sales cannot receive new payments"
INVALID_STATUS_TRANSITION = "Payment status transition is not allowed"


class FinanceService:
    def __init__(self, repository: FinanceRepository) -> None:
        self._repository = repository

    def register_payment(self, payload: PaymentCreateRequest) -> Pagamento:
        sale = self._repository.get_sale(payload.venda_id)
        if sale is None:
            raise ValueError(SALE_NOT_FOUND)
        if sale.status == SaleStatus.CANCELADA:
            raise ValueError(SALE_CANCELLED)

        return self._repository.create_payment(
            venda_id=payload.venda_id,
            tipo=payload.tipo.value,
            valor=payload.valor,
            observacoes=payload.observacoes,
        )

    def list_payments(
        self,
        *,
        status: PaymentStatus | None = None,
        venda_id: UUID | None = None,
    ) -> list[Pagamento]:
        return self._repository.list_payments(status=status, venda_id=venda_id)

    def get_payment(self, payment_id: UUID) -> Pagamento:
        payment = self._repository.get_payment_by_id(payment_id)
        if payment is None:
            raise ValueError(PAYMENT_NOT_FOUND)
        return payment

    def update_payment_status(self, payment_id: UUID, new_status: PaymentStatus) -> Pagamento:
        payment = self._repository.get_payment_by_id(payment_id)
        if payment is None:
            raise ValueError(PAYMENT_NOT_FOUND)

        current_status = PaymentStatus(payment.status)
        if new_status not in ALLOWED_PAYMENT_TRANSITIONS[current_status]:
            raise ValueError(INVALID_STATUS_TRANSITION)

        payment.status = new_status
        return self._repository.update_payment_status(payment)

    def get_summary(
        self,
        *,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> FinanceSummaryResponse:
        if start_date is not None and end_date is not None and start_date > end_date:
            raise ValueError("start_date must be less than or equal to end_date")
        return self._repository.get_summary(start_date=start_date, end_date=end_date)
