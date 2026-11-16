import { apiRequest } from './httpClient'
import type {
  FinanceSummaryBody,
  SalesReportBody,
  VehicleInventoryReportBody,
} from './types/reports'

export type DateRangeParams = {
  startDate?: string
  endDate?: string
}

function appendDateRange(path: string, range?: DateRangeParams): string {
  if (!range?.startDate && !range?.endDate) {
    return path
  }
  const params = new URLSearchParams()
  if (range.startDate) {
    params.set('start_date', range.startDate)
  }
  if (range.endDate) {
    params.set('end_date', range.endDate)
  }
  return `${path}?${params.toString()}`
}

export function getSalesReport(
  token: string,
  range?: DateRangeParams,
): Promise<SalesReportBody> {
  return apiRequest<SalesReportBody>(appendDateRange('/api/reports/sales', range), {
    token,
  })
}

export function getVehicleInventoryReport(
  token: string,
): Promise<VehicleInventoryReportBody> {
  return apiRequest<VehicleInventoryReportBody>('/api/reports/vehicles', { token })
}

export function getFinancialReport(
  token: string,
  range?: DateRangeParams,
): Promise<FinanceSummaryBody> {
  return apiRequest<FinanceSummaryBody>(appendDateRange('/api/reports/finance', range), {
    token,
  })
}