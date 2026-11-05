from decimal import Decimal

from pydantic import BaseModel, Field

from app.modules.finance.schemas import FinanceSummaryResponse


class SalesReportResponse(BaseModel):
    total_sales: int = 0
    pending_sales: int = 0
    processing_sales: int = 0
    completed_sales: int = 0
    cancelled_sales: int = 0
    completed_sales_value: Decimal = Field(default=Decimal("0.00"))


class VehicleInventoryReportResponse(BaseModel):
    total_vehicles: int = 0
    available_vehicles: int = 0
    reserved_vehicles: int = 0
    sold_vehicles: int = 0
    unavailable_vehicles: int = 0
    inventory_value: Decimal = Field(default=Decimal("0.00"))


FinancialReportResponse = FinanceSummaryResponse
