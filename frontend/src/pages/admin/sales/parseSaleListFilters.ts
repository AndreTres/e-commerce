import type { SaleStatus } from '../../../types/sale'
import { SALE_STATUSES } from '../../../types/sale'
import type { ListSalesOptions } from '../../../api/salesApi'

export type SaleListFiltersState = {
  status: SaleStatus | ''
  clienteId: string
  veiculoId: string
}

export function filtersFromSearchParams(params: URLSearchParams): SaleListFiltersState {
  const rawStatus = params.get('status') ?? ''
  const status = SALE_STATUSES.includes(rawStatus as SaleStatus)
    ? (rawStatus as SaleStatus)
    : ''

  return {
    status,
    clienteId: params.get('cliente_id') ?? '',
    veiculoId: params.get('veiculo_id') ?? '',
  }
}

export function searchParamsFromFilters(filters: SaleListFiltersState): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.status) {
    next.set('status', filters.status)
  }
  if (filters.clienteId.trim()) {
    next.set('cliente_id', filters.clienteId.trim())
  }
  if (filters.veiculoId.trim()) {
    next.set('veiculo_id', filters.veiculoId.trim())
  }
  return next
}

export function toListSalesOptions(filters: SaleListFiltersState): ListSalesOptions {
  return {
    status: filters.status || undefined,
    clienteId: filters.clienteId.trim() || undefined,
    veiculoId: filters.veiculoId.trim() || undefined,
  }
}