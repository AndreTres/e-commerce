import type { TestDriveStatus } from '../../types/testDrive'
import { TEST_DRIVE_STATUS_LABELS } from '../../types/testDrive'

type TestDriveStatusBadgeProps = {
  status: TestDriveStatus
}

export function TestDriveStatusBadge({ status }: TestDriveStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--td-${status.toLowerCase()}`}>
      {TEST_DRIVE_STATUS_LABELS[status]}
    </span>
  )
}
