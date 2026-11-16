import type { NotificationStatus } from '../../types/notification'
import { NOTIFICATION_STATUS_LABELS } from '../../types/notification'

type NotificationStatusBadgeProps = {
  status: NotificationStatus
}

export function NotificationStatusBadge({ status }: NotificationStatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--notification-${status.toLowerCase()}`}
    >
      {NOTIFICATION_STATUS_LABELS[status]}
    </span>
  )
}