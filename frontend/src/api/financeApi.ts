import { apiRequest } from './httpClient'
import type { FinanceSummaryBody, PaymentResponseBody } from './types/finance'

type DateRangeParams = {
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

export function getFinanceSummary(
  token: string,
  range?: DateRangeParams,
): Promise<FinanceSummaryBody> {
  return apiRequest<FinanceSummaryBody>(appendDateRange('/api/finance/summary', range), {
    token,
  })
}

export type ListPaymentsOptions = {
  status?: PaymentResponseBody['status']
  vendaId?: string
}

function buildPaymentsPath(options: ListPaymentsOptions = {}): string {
  const params = new URLSearchParams()
  if (options.status) {
    params.set('status', options.status)
  }
  if (options.vendaId) {
    params.set('venda_id', options.vendaId)
  }
  const query = params.toString()
  return query ? `/api/finance/payments?${query}` : '/api/finance/payments'
}

export async function listPayments(
  token: string,
  options: ListPaymentsOptions = {},
): Promise<PaymentResponseBody[]> {
  return apiRequest<PaymentResponseBody[]>(buildPaymentsPath(options), { token })
}