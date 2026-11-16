import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import {
  getTestDrive,
  updateTestDrive,
  updateTestDriveStatus,
} from '../../../api/testDrivesApi'
import { useAuth } from '../../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import { TestDriveStatusBadge } from '../../../components/testDrives/TestDriveStatusBadge'
import { VehicleStatusBadge } from '../../../components/vehicles/VehicleStatusBadge'
import type { TestDrive, TestDriveStatus } from '../../../types/testDrive'
import {
  getAllowedTestDriveTransitions,
  isFinalTestDriveStatus,
  TEST_DRIVE_STATUS_LABELS,
} from '../../../types/testDrive'
import type { VehicleStatus } from '../../../types/vehicle'
import { formatDateTime } from '../../../utils/format'
import { translateAdminTestDriveError } from '../testDriveErrors'
import { datetimeLocalToIso, isoToDatetimeLocal } from './testDriveDateTime'

export function AdminTestDriveDetailPage() {
  const { testDriveId } = useParams<{ testDriveId: string }>()
  const { getAccessToken } = useAuth()

  const [appointment, setAppointment] = useState<TestDrive | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [scheduledAt, setScheduledAt] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const [statusDraft, setStatusDraft] = useState<TestDriveStatus>('AGENDADO')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const allowedTransitions = useMemo(
    () => (appointment ? getAllowedTestDriveTransitions(appointment.status) : []),
    [appointment],
  )

  const canEditAppointment = appointment
    ? !isFinalTestDriveStatus(appointment.status)
    : false

  const populateEditForm = useCallback((data: TestDrive) => {
    setScheduledAt(isoToDatetimeLocal(data.dataAgendamento))
    setObservacoes(data.observacoes ?? '')
  }, [])

  const loadAppointment = useCallback(async () => {
    if (!testDriveId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    setNotFound(false)
    setSaveError(null)
    setSaveSuccess(null)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const data = await getTestDrive(testDriveId, token)
      setAppointment(data)
      populateEditForm(data)
      setStatusDraft(data.status)
    } catch (err) {
      setAppointment(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(
          translateAdminTestDriveError(err, 'Não foi possível carregar o agendamento.'),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, populateEditForm, testDriveId])

  useEffect(() => {
    void loadAppointment()
  }, [loadAppointment])

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!appointment || !testDriveId || !canEditAppointment) {
      return
    }

    const token = getAccessToken()
    if (!token) {
      return
    }

    if (!scheduledAt.trim()) {
      setSaveError('Informe a data e hora do agendamento.')
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      let dataAgendamento: string
      try {
        dataAgendamento = datetimeLocalToIso(scheduledAt)
      } catch {
        setSaveError('Data e hora inválidas.')
        setSaving(false)
        return
      }

      const updated = await updateTestDrive(
        testDriveId,
        {
          data_agendamento: dataAgendamento,
          observacoes: observacoes.trim() || null,
        },
        token,
      )
      setAppointment(updated)
      populateEditForm(updated)
      setSaveSuccess('Agendamento atualizado com sucesso.')
    } catch (err) {
      setSaveError(
        translateAdminTestDriveError(err, 'Não foi possível salvar o agendamento.'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!appointment || !testDriveId) {
      return
    }

    if (statusDraft === appointment.status) {
      setStatusError('Selecione um status diferente do atual.')
      return
    }

    if (!allowedTransitions.includes(statusDraft)) {
      setStatusError('A transição selecionada não é permitida para este agendamento.')
      return
    }

    const token = getAccessToken()
    if (!token) {
      return
    }

    setStatusSaving(true)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const updated = await updateTestDriveStatus(testDriveId, statusDraft, token)
      setAppointment(updated)
      populateEditForm(updated)
      setStatusDraft(updated.status)
      setStatusSuccess('Status do test drive atualizado com sucesso.')
    } catch (err) {
      setStatusError(
        translateAdminTestDriveError(err, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando test drive…" />
  }

  if (notFound) {
    return (
      <div className="account-stack">
        <ErrorMessage
          title="Agendamento não encontrado"
          message="Verifique o identificador ou volte à listagem."
        />
        <p>
          <Link to="/admin/test-drives">Voltar à gestão de test drives</Link>
        </p>
      </div>
    )
  }

  if (loadError || !appointment) {
    return (
      <ErrorMessage
        title="Erro ao carregar test drive"
        message={loadError ?? 'Ocorreu um erro inesperado.'}
        onRetry={() => void loadAppointment()}
      />
    )
  }

  const vehicleTitle = `${appointment.veiculo.marca} ${appointment.veiculo.modelo}`
  const vehicleStatus = appointment.veiculo.status as VehicleStatus

  return (
    <div className="account-stack">
      <article className="page-content purchase-detail admin-test-drive-detail">
        <p className="vehicle-detail__back">
          <Link to="/admin/test-drives">← Voltar à listagem</Link>
        </p>

        <header className="purchase-detail__header">
          <div>
            <h1>{vehicleTitle}</h1>
            <p className="text-muted">Agendamento {appointment.id}</p>
          </div>
          <TestDriveStatusBadge status={appointment.status} />
        </header>

        <dl className="detail-list purchase-detail__grid">
          <dt>Data/hora agendada</dt>
          <dd>{formatDateTime(appointment.dataAgendamento)}</dd>
          <dt>Data de realização</dt>
          <dd>
            {appointment.dataRealizacao
              ? formatDateTime(appointment.dataRealizacao)
              : '—'}
          </dd>
          <dt>Cliente</dt>
          <dd>
            <Link to={`/admin/clients/${appointment.cliente.id}`}>
              {appointment.cliente.nome}
            </Link>
            <span className="text-muted"> · {appointment.cliente.email}</span>
          </dd>
          <dt>Veículo</dt>
          <dd>
            <Link to={`/admin/vehicles/${appointment.veiculo.id}`}>
              {vehicleTitle} ({appointment.veiculo.ano})
            </Link>
          </dd>
          <dt>Status do veículo</dt>
          <dd>
            <VehicleStatusBadge status={vehicleStatus} />
          </dd>
        </dl>
      </article>

      {canEditAppointment ? (
        <article className="page-content admin-test-drive-detail__edit">
          <h2 className="admin-form-subtitle">Reagendar / observações</h2>
          <p className="text-muted">
            Alterações disponíveis enquanto o agendamento não estiver em status final.
          </p>
          <form className="test-drive-form" onSubmit={handleDetailsSubmit}>
            <div className="form-field">
              <label htmlFor="admin-td-scheduled-at">Data e hora</label>
              <input
                id="admin-td-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-td-observacoes">Observações</label>
              <textarea
                id="admin-td-observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                maxLength={2000}
                rows={4}
                disabled={saving}
              />
            </div>

            {saveError ? (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveSuccess ? (
              <p className="form-success" role="status">
                {saveSuccess}
              </p>
            ) : null}

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar agendamento'}
            </button>
          </form>
        </article>
      ) : (
        <article className="page-content admin-test-drive-detail__edit">
          <h2 className="admin-form-subtitle">Observações</h2>
          {appointment.observacoes?.trim() ? (
            <p>{appointment.observacoes}</p>
          ) : (
            <p className="text-muted">Nenhuma observação registrada.</p>
          )}
          <p className="text-muted" role="status">
            Agendamentos em status final não podem ser alterados.
          </p>
        </article>
      )}

      <article className="page-content admin-test-drive-detail__status">
        <h2 className="admin-form-subtitle">Status do agendamento</h2>
        <p className="text-muted">
          Status atual: <strong>{TEST_DRIVE_STATUS_LABELS[appointment.status]}</strong>.
          Transições permitidas pelo servidor:{' '}
          {allowedTransitions.length > 0
            ? allowedTransitions.map((s) => TEST_DRIVE_STATUS_LABELS[s]).join(', ')
            : 'nenhuma (agendamento finalizado).'}
        </p>

        {allowedTransitions.length > 0 ? (
          <form className="vehicle-status-form" onSubmit={handleStatusSubmit}>
            <div className="form-field">
              <label htmlFor="admin-td-status-draft">Novo status</label>
              <select
                id="admin-td-status-draft"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as TestDriveStatus)}
                disabled={statusSaving}
              >
                <option value={appointment.status}>
                  {TEST_DRIVE_STATUS_LABELS[appointment.status]} (atual)
                </option>
                {allowedTransitions.map((status) => (
                  <option key={status} value={status}>
                    {TEST_DRIVE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {statusError ? (
              <p className="form-error" role="alert">
                {statusError}
              </p>
            ) : null}
            {statusSuccess ? (
              <p className="form-success" role="status">
                {statusSuccess}
              </p>
            ) : null}

            <button type="submit" className="btn-secondary" disabled={statusSaving}>
              {statusSaving ? 'Atualizando…' : 'Atualizar status'}
            </button>
          </form>
        ) : (
          <p className="text-muted" role="status">
            Não há alterações de status disponíveis para este agendamento.
          </p>
        )}
      </article>
    </div>
  )
}