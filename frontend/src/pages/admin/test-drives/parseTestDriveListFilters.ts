import type { ListTestDrivesOptions } from '../../../api/testDrivesApi'
import type { TestDriveStatus } from '../../../types/testDrive'
import { TEST_DRIVE_STATUSES } from '../../../types/testDrive'

export type TestDriveListFiltersState = {
  status: TestDriveStatus | ''
  veiculoId: string
  scheduledDate: string
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): TestDriveListFiltersState {
  const rawStatus = params.get('status') ?? ''
  const status = TEST_DRIVE_STATUSES.includes(rawStatus as TestDriveStatus)
    ? (rawStatus as TestDriveStatus)
    : ''

  return {
    status,
    veiculoId: params.get('veiculo_id') ?? '',
    scheduledDate: params.get('scheduled_date') ?? '',
  }
}

export function searchParamsFromFilters(
  filters: TestDriveListFiltersState,
): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.status) {
    next.set('status', filters.status)
  }
  if (filters.veiculoId.trim()) {
    next.set('veiculo_id', filters.veiculoId.trim())
  }
  if (filters.scheduledDate.trim()) {
    next.set('scheduled_date', filters.scheduledDate.trim())
  }
  return next
}

export function toListTestDrivesOptions(
  filters: TestDriveListFiltersState,
): ListTestDrivesOptions {
  return {
    status: filters.status || undefined,
    veiculoId: filters.veiculoId.trim() || undefined,
    scheduledDate: filters.scheduledDate.trim() || undefined,
  }
}