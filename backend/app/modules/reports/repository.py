from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.sale_status import SaleStatus
from app.core.vehicle_status import VehicleStatus
from app.models.veiculo import Veiculo
from app.models.venda import Venda
from app.modules.finance.schemas import FinanceSummaryResponse
from app.modules.finance.summary import build_finance_summary


class ReportsRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_sales_report(
        self,
        *,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict[str, int | Decimal]:
        statement = select(
            Venda.status,
            func.count(Venda.id),
            func.coalesce(func.sum(Venda.valor_total), 0),
        )
        if start_date is not None:
            statement = statement.where(Venda.data_venda >= start_date)
        if end_date is not None:
            statement = statement.where(Venda.data_venda <= end_date)
        statement = statement.group_by(Venda.status)

        counts: dict[str, int] = {}
        completed_value = Decimal("0.00")

        for status, count, amount in self._db.execute(statement):
            status_key = str(status)
            counts[status_key] = int(count)
            if status_key == SaleStatus.CONCLUIDA:
                completed_value = Decimal(amount)

        pending = counts.get(SaleStatus.PENDENTE, 0)
        processing = counts.get(SaleStatus.EM_PROCESSAMENTO, 0)
        completed = counts.get(SaleStatus.CONCLUIDA, 0)
        cancelled = counts.get(SaleStatus.CANCELADA, 0)
        total = pending + processing + completed + cancelled

        return {
            "total_sales": total,
            "pending_sales": pending,
            "processing_sales": processing,
            "completed_sales": completed,
            "cancelled_sales": cancelled,
            "completed_sales_value": completed_value.quantize(Decimal("0.01")),
        }

    def get_vehicle_inventory_report(self) -> dict[str, int | Decimal]:
        count_statement = select(
            Veiculo.status,
            func.count(Veiculo.id),
        ).group_by(Veiculo.status)

        counts: dict[str, int] = {}
        for status, count in self._db.execute(count_statement):
            counts[str(status)] = int(count)

        value_statement = select(func.coalesce(func.sum(Veiculo.preco), 0)).where(
            Veiculo.status.in_((VehicleStatus.DISPONIVEL, VehicleStatus.RESERVADO))
        )
        inventory_value = Decimal(self._db.scalar(value_statement) or 0).quantize(Decimal("0.01"))

        available = counts.get(VehicleStatus.DISPONIVEL, 0)
        reserved = counts.get(VehicleStatus.RESERVADO, 0)
        sold = counts.get(VehicleStatus.VENDIDO, 0)
        unavailable = counts.get(VehicleStatus.INDISPONIVEL, 0)
        total = available + reserved + sold + unavailable

        return {
            "total_vehicles": total,
            "available_vehicles": available,
            "reserved_vehicles": reserved,
            "sold_vehicles": sold,
            "unavailable_vehicles": unavailable,
            "inventory_value": inventory_value,
        }

    def get_financial_summary(
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
