import type { ListPaymentsOptions } from '../../../api/financeApi'
import type { PaymentStatus } from '../../../types/payment'
import { PAYMENT_STATUSES } from '../../../types/payment'

export type PaymentListFiltersState = {
  status: PaymentStatus | ''
  vendaId: string
}

export function filtersFromSearchParams(params: URLSearchParams): PaymentListFiltersState {
  const rawStatus = params.get('status') ?? ''
  const status = PAYMENT_STATUSES.includes(rawStatus as PaymentStatus)
    ? (rawStatus as PaymentStatus)
    : ''

  return {
    status,
    vendaId: params.get('venda_id') ?? '',
  }
}

export function searchParamsFromFilters(
  filters: PaymentListFiltersState,
): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.status) {
    next.set('status', filters.status)
  }
  if (filters.vendaId.trim()) {
    next.set('venda_id', filters.vendaId.trim())
  }
  return next
}

export function toListPaymentsOptions(
  filters: PaymentListFiltersState,
): ListPaymentsOptions {
  return {
    status: filters.status || undefined,
    vendaId: filters.vendaId.trim() || undefined,
  }
}