import { Link } from 'react-router-dom'
import type { TestDrive } from '../../types/testDrive'
import { formatDateTime } from '../../utils/format'
import { TestDriveStatusBadge } from './TestDriveStatusBadge'

type TestDriveListItemProps = {
  appointment: TestDrive
  onCancel?: (appointmentId: string) => void
  cancelingId?: string | null
  canCancel: boolean
}

const CANCELABLE_STATUSES = new Set(['AGENDADO', 'CONFIRMADO'])

export function TestDriveListItem({
  appointment,
  onCancel,
  cancelingId,
  canCancel,
}: TestDriveListItemProps) {
  const vehicleTitle = `${appointment.veiculo.marca} ${appointment.veiculo.modelo}`
  const showCancel =
    canCancel && CANCELABLE_STATUSES.has(appointment.status) && onCancel

  return (
    <article className="test-drive-item">
      <div className="test-drive-item__main">
        <h2 className="test-drive-item__title">{vehicleTitle}</h2>
        <p className="text-muted test-drive-item__meta">
          Agendado para {formatDateTime(appointment.dataAgendamento)}
        </p>
        {appointment.dataRealizacao ? (
          <p className="text-muted test-drive-item__meta">
            Realizado em {formatDateTime(appointment.dataRealizacao)}
          </p>
        ) : null}
        {appointment.observacoes?.trim() ? (
          <p className="test-drive-item__notes">{appointment.observacoes}</p>
        ) : null}
        <p className="test-drive-item__vehicle-link">
          <Link to={`/vehicles/${appointment.veiculo.id}`}>Ver veículo</Link>
        </p>
      </div>
      <div className="test-drive-item__aside">
        <TestDriveStatusBadge status={appointment.status} />
        {showCancel ? (
          <button
            type="button"
            className="btn-secondary btn-cancel-td"
            disabled={cancelingId === appointment.id}
            onClick={() => onCancel(appointment.id)}
          >
            {cancelingId === appointment.id ? 'Cancelando…' : 'Cancelar'}
          </button>
        ) : null}
      </div>
    </article>
  )
}
