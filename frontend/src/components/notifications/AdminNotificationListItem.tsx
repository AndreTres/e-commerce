import type { Notification } from '../../types/notification'
import { NOTIFICATION_TYPE_LABELS } from '../../types/notification'
import { formatDateTime } from '../../utils/format'
import { NotificationStatusBadge } from './NotificationStatusBadge'

type AdminNotificationListItemProps = {
  notification: Notification
  selected: boolean
  onSelect: (id: string) => void
}

export function AdminNotificationListItem({
  notification,
  selected,
  onSelect,
}: AdminNotificationListItemProps) {
  const preview =
    notification.mensagem.length > 80
      ? `${notification.mensagem.slice(0, 80)}…`
      : notification.mensagem

  return (
    <article
      className={`admin-notification-item${selected ? ' admin-notification-item--selected' : ''}`}
    >
      <button
        type="button"
        className="admin-notification-item__button"
        onClick={() => onSelect(notification.id)}
        aria-current={selected ? 'true' : undefined}
      >
        <div className="admin-notification-item__main">
          <h2 className="admin-notification-item__title">
            {NOTIFICATION_TYPE_LABELS[notification.tipo]}
          </h2>
          <p className="text-muted admin-notification-item__meta">
            {formatDateTime(notification.dataEnvio)} · Cliente{' '}
            {notification.clienteId.slice(0, 8)}…
          </p>
          <p className="admin-notification-item__preview">{preview}</p>
        </div>
        <div className="admin-notification-item__aside">
          <NotificationStatusBadge status={notification.status} />
        </div>
      </button>
    </article>
  )
}