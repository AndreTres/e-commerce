import type { NotificationStatus, NotificationType } from '../../types/notification'

export type NotificationResponseBody = {
  id: string
  cliente_id: string
  tipo: NotificationType
  mensagem: string
  data_envio: string
  status: NotificationStatus
}