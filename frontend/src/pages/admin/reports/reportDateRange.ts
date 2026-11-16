import type { DateRangeParams } from '../../../api/reportsApi'

export type ReportDateFilterState = {
  startDate: string
  endDate: string
}

export function dateFiltersFromSearchParams(params: URLSearchParams): ReportDateFilterState {
  return {
    startDate: params.get('start_date') ?? '',
    endDate: params.get('end_date') ?? '',
  }
}

export function searchParamsFromDateFilters(
  filters: ReportDateFilterState,
): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.startDate.trim()) {
    next.set('start_date', filters.startDate.trim())
  }
  if (filters.endDate.trim()) {
    next.set('end_date', filters.endDate.trim())
  }
  return next
}

export function validateDateFilters(filters: ReportDateFilterState): string | null {
  const { startDate, endDate } = filters
  if (startDate && endDate && startDate > endDate) {
    return 'A data inicial deve ser anterior ou igual à data final.'
  }
  return null
}

/** Converte datas do formulário (`YYYY-MM-DD`) para query ISO aceita pela API. */
export function toApiDateRange(filters: ReportDateFilterState): DateRangeParams | undefined {
  const start = filters.startDate.trim()
  const end = filters.endDate.trim()
  if (!start && !end) {
    return undefined
  }
  return {
    startDate: start ? `${start}T00:00:00.000Z` : undefined,
    endDate: end ? `${end}T23:59:59.999Z` : undefined,
  }
}