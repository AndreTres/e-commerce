import type { SaleStatus } from '../../types/sale'
import { SALE_STATUS_LABELS } from '../../types/sale'

type SaleStatusBadgeProps = {
  status: SaleStatus
}

export function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--sale-${status.toLowerCase()}`}>
      {SALE_STATUS_LABELS[status]}
    </span>
  )
}
