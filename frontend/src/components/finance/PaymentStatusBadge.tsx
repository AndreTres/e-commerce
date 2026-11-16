import type { PaymentStatus } from '../../types/payment'
import { PAYMENT_STATUS_LABELS } from '../../types/payment'

type PaymentStatusBadgeProps = {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--payment-${status.toLowerCase()}`}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}