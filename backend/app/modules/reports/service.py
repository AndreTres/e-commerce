from datetime import datetime

from app.modules.finance.schemas import FinanceSummaryResponse
from app.modules.reports.repository import ReportsRepository
from app.modules.reports.schemas import SalesReportResponse, VehicleInventoryReportResponse

INVALID_DATE_RANGE = "start_date must be less than or equal to end_date"


class ReportsService:
    def __init__(self, repository: ReportsRepository) -> None:
        self._repository = repository

    def get_sales_report(
        self,
        *,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> SalesReportResponse:
        self._validate_date_range(start_date, end_date)
        data = self._repository.get_sales_report(start_date=start_date, end_date=end_date)
        return SalesReportResponse.model_validate(data)

    def get_vehicle_inventory_report(self) -> VehicleInventoryReportResponse:
        data = self._repository.get_vehicle_inventory_report()
        return VehicleInventoryReportResponse.model_validate(data)

    def get_financial_report(
        self,
        *,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> FinanceSummaryResponse:
        self._validate_date_range(start_date, end_date)
        return self._repository.get_financial_summary(
            start_date=start_date,
            end_date=end_date,
        )

    @staticmethod
    def _validate_date_range(
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> None:
        if start_date is not None and end_date is not None and start_date > end_date:
            raise ValueError(INVALID_DATE_RANGE)
