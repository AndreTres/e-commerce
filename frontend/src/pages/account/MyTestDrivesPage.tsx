import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import {
  cancelTestDrive,
  listTestDrives,
  scheduleTestDrive,
} from '../../api/testDrivesApi'
import { listVehicles } from '../../api/vehiclesApi'
import { useAuth } from '../../auth/AuthContext'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { TestDriveListItem } from '../../components/testDrives/TestDriveListItem'
import type { Vehicle } from '../../types/vehicle'
import type { TestDrive, TestDriveStatus } from '../../types/testDrive'
import {
  TEST_DRIVE_STATUSES,
  TEST_DRIVE_STATUS_LABELS,
} from '../../types/testDrive'
import { translateTestDriveError } from './testDriveErrors'

const CLIENT_PROFILE_REQUIRED =
  'Authenticated client account is not linked to a customer record'

function datetimeLocalToIso(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data e hora inválidas.')
  }
  return parsed.toISOString()
}

export function MyTestDrivesPage() {
  const { getAccessToken, clienteId } = useAuth()

  const [appointments, setAppointments] = useState<TestDrive[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [statusFilter, setStatusFilter] = useState<TestDriveStatus | ''>('')

  const [loadingList, setLoadingList] = useState(true)
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null)

  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null)

  const loadAppointments = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoadingList(false)
      return
    }

    setLoadingList(true)
    setListError(null)

    try {
      const data = await listTestDrives(token, {
        status: statusFilter || undefined,
      })
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.dataAgendamento).getTime() -
          new Date(a.dataAgendamento).getTime(),
      )
      setAppointments(sorted)
    } catch (err) {
      let message = 'Não foi possível carregar os agendamentos.'
      if (err instanceof ApiError && err.detail === CLIENT_PROFILE_REQUIRED) {
        message =
          'Sua conta não está vinculada a um cadastro de cliente. Contate a concessionária.'
      } else {
        message = translateTestDriveError(err, message)
      }
      setListError(message)
      setAppointments([])
    } finally {
      setLoadingList(false)
    }
  }, [getAccessToken, statusFilter])

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true)
    try {
      const data = await listVehicles()
      setVehicles(data)
      if (data.length > 0) {
        setVehicleId((current) => current || data[0].id)
      }
    } catch {
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = getAccessToken()
    if (!token) {
      return
    }

    if (!clienteId) {
      setScheduleError('Sua conta não está vinculada a um cadastro de cliente.')
      return
    }

    if (!vehicleId || !scheduledAt) {
      setScheduleError('Selecione o veículo e a data/hora do test drive.')
      return
    }

    setScheduling(true)
    setScheduleError(null)
    setScheduleSuccess(null)
    setCancelFeedback(null)

    try {
      const dataAgendamento = datetimeLocalToIso(scheduledAt)
      await scheduleTestDrive(
        {
          veiculo_id: vehicleId,
          data_agendamento: dataAgendamento,
          observacoes: observacoes.trim() || undefined,
        },
        token,
      )
      setScheduleSuccess('Test drive agendado com sucesso.')
      setObservacoes('')
      setScheduledAt('')
      await loadAppointments()
    } catch (err) {
      setScheduleError(
        translateTestDriveError(err, 'Não foi possível agendar o test drive.'),
      )
    } finally {
      setScheduling(false)
    }
  }

  async function handleCancel(appointmentId: string) {
    const token = getAccessToken()
    if (!token) {
      return
    }

    const confirmed = window.confirm(
      'Deseja cancelar este agendamento de test drive?',
    )
    if (!confirmed) {
      return
    }

    setCancelingId(appointmentId)
    setCancelFeedback(null)

    try {
      await cancelTestDrive(appointmentId, token)
      setCancelFeedback('Agendamento cancelado com sucesso.')
      await loadAppointments()
    } catch (err) {
      setCancelFeedback(
        translateTestDriveError(err, 'Não foi possível cancelar o agendamento.'),
      )
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className="account-stack">
      <header className="account-page-header">
        <h1>Meus test drives</h1>
        <p className="text-muted">
          Agende um test drive para veículos do catálogo e acompanhe o status dos seus
          agendamentos.
        </p>
      </header>

      <section className="page-content test-drive-schedule">
        <h2>Novo agendamento</h2>
        {!clienteId ? (
          <p className="form-error" role="alert">
            Vincule sua conta a um cadastro de cliente para agendar test drives.
          </p>
        ) : null}

        <form className="test-drive-form" onSubmit={handleSchedule}>
          <div className="form-field">
            <label htmlFor="td-vehicle">Veículo</label>
            <select
              id="td-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={scheduling || loadingVehicles || !clienteId}
              required
            >
              {loadingVehicles ? <option value="">Carregando veículos…</option> : null}
              {!loadingVehicles && vehicles.length === 0 ? (
                <option value="">Nenhum veículo disponível</option>
              ) : null}
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="td-datetime">Data e hora</label>
            <input
              id="td-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              disabled={scheduling || !clienteId}
            />
          </div>

          <div className="form-field">
            <label htmlFor="td-notes">Observações (opcional)</label>
            <textarea
              id="td-notes"
              rows={3}
              maxLength={2000}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={scheduling || !clienteId}
            />
          </div>

          {scheduleError ? (
            <p className="form-error" role="alert">
              {scheduleError}
            </p>
          ) : null}
          {scheduleSuccess ? (
            <p className="form-success" role="status">
              {scheduleSuccess}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary"
            disabled={scheduling || !clienteId || vehicles.length === 0}
          >
            {scheduling ? 'Agendando…' : 'Agendar test drive'}
          </button>
        </form>

        {vehicles.length === 0 && !loadingVehicles ? (
          <p className="text-muted">
            <Link to="/vehicles">Ver catálogo de veículos</Link>
          </p>
        ) : null}
      </section>

      <div className="page-content purchases-toolbar">
        <label className="form-field purchases-filter" htmlFor="td-status-filter">
          Filtrar por status
          <select
            id="td-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value || '') as TestDriveStatus | '')
            }
            disabled={loadingList}
          >
            <option value="">Todos</option>
            {TEST_DRIVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TEST_DRIVE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cancelFeedback ? (
        <p
          className={
            cancelFeedback.includes('sucesso') ? 'form-success' : 'form-error'
          }
          role="status"
        >
          {cancelFeedback}
        </p>
      ) : null}

      {loadingList ? <LoadingMessage label="Carregando agendamentos…" /> : null}

      {!loadingList && listError ? (
        <ErrorMessage message={listError} onRetry={() => void loadAppointments()} />
      ) : null}

      {!loadingList && !listError && appointments.length === 0 ? (
        <EmptyMessage
          title="Nenhum test drive encontrado"
          message={
            statusFilter
              ? 'Não há agendamentos com o status selecionado.'
              : 'Você ainda não possui test drives agendados.'
          }
          action={
            <Link to="/vehicles" className="btn-secondary btn-secondary--inline">
              Explorar catálogo
            </Link>
          }
        />
      ) : null}

      {!loadingList && !listError && appointments.length > 0 ? (
        <div className="test-drive-list">
          {appointments.map((appointment) => (
            <TestDriveListItem
              key={appointment.id}
              appointment={appointment}
              canCancel
              onCancel={handleCancel}
              cancelingId={cancelingId}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
