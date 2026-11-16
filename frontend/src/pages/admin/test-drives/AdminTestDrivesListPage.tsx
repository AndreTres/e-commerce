import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listTestDrives } from '../../../api/testDrivesApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminTestDriveListItem } from '../../../components/testDrives/AdminTestDriveListItem'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { TestDrive } from '../../../types/testDrive'
import {
  TEST_DRIVE_STATUSES,
  TEST_DRIVE_STATUS_LABELS,
} from '../../../types/testDrive'
import { translateAdminTestDriveError } from '../testDriveErrors'
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  toListTestDrivesOptions,
  type TestDriveListFiltersState,
} from './parseTestDriveListFilters'

const emptyFilters: TestDriveListFiltersState = {
  status: '',
  veiculoId: '',
  scheduledDate: '',
}

export function AdminTestDrivesListPage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()

  const [draft, setDraft] = useState<TestDriveListFiltersState>(() =>
    filtersFromSearchParams(searchParams),
  )
  const [appointments, setAppointments] = useState<TestDrive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(filtersFromSearchParams(searchParams))
  }, [filterKey, searchParams])

  const loadAppointments = useCallback(
    async (filters: TestDriveListFiltersState) => {
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await listTestDrives(token, toListTestDrivesOptions(filters))
        setAppointments(data)
      } catch (err) {
        setAppointments([])
        setError(
          translateAdminTestDriveError(err, 'Não foi possível carregar os test drives.'),
        )
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void loadAppointments(filtersFromSearchParams(searchParams))
  }, [filterKey, loadAppointments, searchParams])

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchParams(searchParamsFromFilters(draft), { replace: true })
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setSearchParams({}, { replace: true })
  }

  const activeFilters = filtersFromSearchParams(searchParams)
  const hasActiveFilters =
    Boolean(activeFilters.status) ||
    Boolean(activeFilters.veiculoId.trim()) ||
    Boolean(activeFilters.scheduledDate.trim())

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão de test drives</h1>
          <p className="text-muted">
            Filtre por status, veículo ou data agendada conforme a API de listagem.
          </p>
        </div>
      </header>

      <form className="admin-test-drive-filters page-content" onSubmit={handleFilterSubmit}>
        <div className="form-field purchases-filter">
          <label htmlFor="admin-td-status">Status</label>
          <select
            id="admin-td-status"
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: (e.target.value || '') as TestDriveListFiltersState['status'],
              }))
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {TEST_DRIVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TEST_DRIVE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="admin-td-veiculo-id">ID do veículo</label>
          <input
            id="admin-td-veiculo-id"
            value={draft.veiculoId}
            onChange={(e) => setDraft((prev) => ({ ...prev, veiculoId: e.target.value }))}
            placeholder="UUID do veículo"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="admin-td-scheduled-date">Data agendada</label>
          <input
            id="admin-td-scheduled-date"
            type="date"
            value={draft.scheduledDate}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, scheduledDate: e.target.value }))
            }
            disabled={loading}
          />
        </div>
        <div className="admin-test-drive-filters__actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            Aplicar filtros
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              disabled={loading}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingMessage label="Carregando test drives…" /> : null}

      {!loading && error ? (
        <ErrorMessage
          message={error}
          onRetry={() => void loadAppointments(activeFilters)}
        />
      ) : null}

      {!loading && !error && appointments.length === 0 ? (
        <EmptyMessage
          title={
            hasActiveFilters ? 'Nenhum test drive encontrado' : 'Nenhum test drive registrado'
          }
          message={
            hasActiveFilters
              ? 'Ajuste os filtros ou limpe para ver todos os agendamentos.'
              : 'Ainda não há agendamentos no sistema.'
          }
          action={
            hasActiveFilters ? (
              <button type="button" className="btn-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : null}

      {!loading && !error && appointments.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {appointments.length} agendamento{appointments.length === 1 ? '' : 's'}
          </p>
          <div className="test-drive-list">
            {appointments.map((appointment) => (
              <AdminTestDriveListItem key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}