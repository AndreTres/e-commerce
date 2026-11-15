export type SalesReportBody = {
  total_sales: number
  pending_sales: number
  processing_sales: number
  completed_sales: number
  cancelled_sales: number
  completed_sales_value: string | number
}

export type VehicleInventoryReportBody = {
  total_vehicles: number
  available_vehicles: number
  reserved_vehicles: number
  sold_vehicles: number
  unavailable_vehicles: number
  inventory_value: string | number
}

export type FinanceSummaryBody = {
  total_payments: number
  approved_payments_value: string | number
  pending_payments_value: string | number
  rejected_payments_value: string | number
  cancelled_payments_value: string | number
}