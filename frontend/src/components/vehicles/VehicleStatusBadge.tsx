import type { VehicleStatus } from '../../types/vehicle'
import { VEHICLE_STATUS_LABELS } from '../../types/vehicle'

type VehicleStatusBadgeProps = {
  status: VehicleStatus
}

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {VEHICLE_STATUS_LABELS[status]}
    </span>
  )
}
