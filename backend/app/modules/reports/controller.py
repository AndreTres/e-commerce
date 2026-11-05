from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.roles import UserRole
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.modules.finance.schemas import FinanceSummaryResponse
from app.modules.reports.repository import ReportsRepository
from app.modules.reports.schemas import SalesReportResponse, VehicleInventoryReportResponse
from app.modules.reports.service import INVALID_DATE_RANGE, ReportsService

router = APIRouter(prefix="/api/reports", tags=["reports"])

ReportManagers = Annotated[
    Usuario,
    Depends(require_roles(UserRole.MANAGER, UserRole.ADMIN)),
]


def get_reports_repository(db: Session = Depends(get_db)) -> ReportsRepository:
    return ReportsRepository(db)


def get_reports_service(
    repository: Annotated[ReportsRepository, Depends(get_reports_repository)],
) -> ReportsService:
    return ReportsService(repository)


@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    _: ReportManagers,
    service: Annotated[ReportsService, Depends(get_reports_service)],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> SalesReportResponse:
    try:
        return service.get_sales_report(start_date=start_date, end_date=end_date)
    except ValueError as exc:
        if str(exc) == INVALID_DATE_RANGE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=INVALID_DATE_RANGE,
            ) from exc
        raise


@router.get("/vehicles", response_model=VehicleInventoryReportResponse)
def get_vehicle_inventory_report(
    _: ReportManagers,
    service: Annotated[ReportsService, Depends(get_reports_service)],
) -> VehicleInventoryReportResponse:
    return service.get_vehicle_inventory_report()


@router.get("/finance", response_model=FinanceSummaryResponse)
def get_financial_report(
    _: ReportManagers,
    service: Annotated[ReportsService, Depends(get_reports_service)],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> FinanceSummaryResponse:
    try:
        return service.get_financial_report(start_date=start_date, end_date=end_date)
    except ValueError as exc:
        if str(exc) == INVALID_DATE_RANGE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=INVALID_DATE_RANGE,
            ) from exc
        raise
