from fastapi import FastAPI

from app.modules.auth.controller import router as auth_router
from app.modules.clients.controller import router as clients_router
from app.modules.finance.controller import router as finance_router
from app.modules.financing.controller import router as financing_router
from app.modules.notifications.controller import router as notifications_router
from app.modules.reports.controller import router as reports_router
from app.modules.sales.controller import router as sales_router
from app.modules.test_drives.controller import router as test_drives_router
from app.modules.vehicles.controller import router as vehicles_router

app = FastAPI(title="Automotive E-commerce API")

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(sales_router)
app.include_router(finance_router)
app.include_router(financing_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(test_drives_router)
app.include_router(vehicles_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
