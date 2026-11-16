import { Link } from 'react-router-dom'
import type { TestDrive } from '../../types/testDrive'
import { formatDateTime } from '../../utils/format'
import { TestDriveStatusBadge } from './TestDriveStatusBadge'

type AdminTestDriveListItemProps = {
  appointment: TestDrive
}

export function AdminTestDriveListItem({ appointment }: AdminTestDriveListItemProps) {
  const vehicleTitle = `${appointment.veiculo.marca} ${appointment.veiculo.modelo}`

  return (
    <article className="test-drive-item">
      <div className="test-drive-item__main">
        <h2 className="test-drive-item__title">
          <Link to={`/admin/test-drives/${appointment.id}`}>{vehicleTitle}</Link>
        </h2>
        <p className="text-muted test-drive-item__meta">
          {appointment.cliente.nome} · Agendado para{' '}
          {formatDateTime(appointment.dataAgendamento)}
        </p>
      </div>
      <div className="test-drive-item__aside">
        <TestDriveStatusBadge status={appointment.status} />
      </div>
    </article>
  )
}