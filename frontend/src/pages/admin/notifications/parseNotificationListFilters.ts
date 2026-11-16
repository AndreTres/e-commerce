import type { ListNotificationsOptions } from '../../../api/notificationsApi'
import type { NotificationStatus, NotificationType } from '../../../types/notification'
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from '../../../types/notification'

export type NotificationListFiltersState = {
  status: NotificationStatus | ''
  tipo: NotificationType | ''
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): NotificationListFiltersState {
  const rawStatus = params.get('status') ?? ''
  const status = NOTIFICATION_STATUSES.includes(rawStatus as NotificationStatus)
    ? (rawStatus as NotificationStatus)
    : ''

  const rawTipo = params.get('tipo') ?? ''
  const tipo = NOTIFICATION_TYPES.includes(rawTipo as NotificationType)
    ? (rawTipo as NotificationType)
    : ''

  return { status, tipo }
}

export function getSelectedNotificationId(params: URLSearchParams): string {
  return params.get('selected') ?? ''
}

export function searchParamsFromFilters(
  filters: NotificationListFiltersState,
  selectedId?: string,
): URLSearchParams {
  const next = new URLSearchParams()
  if (filters.status) {
    next.set('status', filters.status)
  }
  if (filters.tipo) {
    next.set('tipo', filters.tipo)
  }
  if (selectedId) {
    next.set('selected', selectedId)
  }
  return next
}

export function toListNotificationsOptions(
  filters: NotificationListFiltersState,
): ListNotificationsOptions {
  return {
    status: filters.status || undefined,
    tipo: filters.tipo || undefined,
  }
}