import type {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../types/notification'
import { apiRequest } from './httpClient'
import type { NotificationResponseBody } from './types/notification'

function mapNotification(dto: NotificationResponseBody): Notification {
  return {
    id: dto.id,
    clienteId: dto.cliente_id,
    tipo: dto.tipo,
    mensagem: dto.mensagem,
    dataEnvio: dto.data_envio,
    status: dto.status,
  }
}

export type ListNotificationsOptions = {
  status?: NotificationStatus
  tipo?: NotificationType
}

function buildListPath(options: ListNotificationsOptions = {}): string {
  const params = new URLSearchParams()
  if (options.status) {
    params.set('status', options.status)
  }
  if (options.tipo) {
    params.set('tipo', options.tipo)
  }
  const query = params.toString()
  return query ? `/api/notifications?${query}` : '/api/notifications'
}

export async function listNotifications(
  token: string,
  options: ListNotificationsOptions = {},
): Promise<Notification[]> {
  const data = await apiRequest<NotificationResponseBody[]>(buildListPath(options), {
    token,
  })
  return data.map(mapNotification)
}

export async function getNotification(
  notificationId: string,
  token: string,
): Promise<Notification> {
  const data = await apiRequest<NotificationResponseBody>(
    `/api/notifications/${notificationId}`,
    { token },
  )
  return mapNotification(data)
}

export async function updateNotificationStatus(
  notificationId: string,
  status: NotificationStatus,
  token: string,
): Promise<Notification> {
  const data = await apiRequest<NotificationResponseBody>(
    `/api/notifications/${notificationId}/status`,
    {
      method: 'PATCH',
      body: { status },
      token,
    },
  )
  return mapNotification(data)
}