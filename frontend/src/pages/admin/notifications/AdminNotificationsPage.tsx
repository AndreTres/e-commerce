import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import {
  getNotification,
  listNotifications,
  updateNotificationStatus,
} from '../../../api/notificationsApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminNotificationListItem } from '../../../components/notifications/AdminNotificationListItem'
import { NotificationStatusBadge } from '../../../components/notifications/NotificationStatusBadge'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { Notification, NotificationStatus } from '../../../types/notification'
import {
  getAllowedNotificationTransitions,
  NOTIFICATION_STATUSES,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from '../../../types/notification'
import { formatDateTime } from '../../../utils/format'
import { translateNotificationError } from '../notificationErrors'
import {
  filtersFromSearchParams,
  getSelectedNotificationId,
  searchParamsFromFilters,
  toListNotificationsOptions,
  type NotificationListFiltersState,
} from './parseNotificationListFilters'

const emptyFilters: NotificationListFiltersState = {
  status: '',
  tipo: '',
}

export function AdminNotificationsPage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const selectedId = getSelectedNotificationId(searchParams)

  const [draft, setDraft] = useState<NotificationListFiltersState>(() =>
    filtersFromSearchParams(searchParams),
  )
  const [items, setItems] = useState<Notification[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [detail, setDetail] = useState<Notification | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailNotFound, setDetailNotFound] = useState(false)

  const [statusDraft, setStatusDraft] = useState<NotificationStatus>('PENDENTE')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const allowedTransitions = useMemo(
    () => (detail ? getAllowedNotificationTransitions(detail.status) : []),
    [detail],
  )

  useEffect(() => {
    setDraft(filtersFromSearchParams(searchParams))
  }, [filterKey, searchParams])

  const loadList = useCallback(
    async (filters: NotificationListFiltersState) => {
      const token = getAccessToken()
      if (!token) {
        setLoadingList(false)
        return
      }

      setLoadingList(true)
      setListError(null)

      try {
        const data = await listNotifications(token, toListNotificationsOptions(filters))
        setItems(data)
      } catch (err) {
        setItems([])
        setListError(
          translateNotificationError(err, 'Não foi possível carregar as notificações.'),
        )
      } finally {
        setLoadingList(false)
      }
    },
    [getAccessToken],
  )

  const loadDetail = useCallback(
    async (notificationId: string) => {
      const token = getAccessToken()
      if (!token || !notificationId) {
        setDetail(null)
        return
      }

      setLoadingDetail(true)
      setDetailError(null)
      setDetailNotFound(false)
      setStatusError(null)
      setStatusSuccess(null)

      try {
        const data = await getNotification(notificationId, token)
        setDetail(data)
        setStatusDraft(data.status)
      } catch (err) {
        setDetail(null)
        if (err instanceof ApiError && err.status === 404) {
          setDetailNotFound(true)
        } else {
          setDetailError(
            translateNotificationError(err, 'Não foi possível carregar a notificação.'),
          )
        }
      } finally {
        setLoadingDetail(false)
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void loadList(filtersFromSearchParams(searchParams))
  }, [filterKey, loadList, searchParams])

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId)
    } else {
      setDetail(null)
      setDetailError(null)
      setDetailNotFound(false)
    }
  }, [loadDetail, selectedId])

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchParams(searchParamsFromFilters(draft, selectedId || undefined), {
      replace: true,
    })
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setSearchParams(selectedId ? new URLSearchParams({ selected: selectedId }) : {}, {
      replace: true,
    })
  }

  function selectNotification(id: string) {
    const filters = filtersFromSearchParams(searchParams)
    setSearchParams(searchParamsFromFilters(filters, id), { replace: true })
  }

  function clearSelection() {
    const filters = filtersFromSearchParams(searchParams)
    setSearchParams(searchParamsFromFilters(filters), { replace: true })
  }

  const activeFilters = filtersFromSearchParams(searchParams)
  const hasActiveFilters = Boolean(activeFilters.status) || Boolean(activeFilters.tipo)

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !selectedId) {
      return
    }

    if (statusDraft === detail.status) {
      setStatusError('Selecione um status diferente do atual.')
      return
    }

    if (!allowedTransitions.includes(statusDraft)) {
      setStatusError('A transição selecionada não é permitida para esta notificação.')
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
      const updated = await updateNotificationStatus(selectedId, statusDraft, token)
      setDetail(updated)
      setStatusDraft(updated.status)
      setStatusSuccess('Status da notificação atualizado com sucesso.')
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (err) {
      setStatusError(
        translateNotificationError(err, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão de notificações</h1>
          <p className="text-muted">
            Listagem e atualização de status disponíveis apenas para administradores,
            conforme a API de notificações.
          </p>
        </div>
      </header>

      <form
        className="admin-notification-filters page-content"
        onSubmit={handleFilterSubmit}
      >
        <div className="form-field purchases-filter">
          <label htmlFor="admin-notif-status">Status</label>
          <select
            id="admin-notif-status"
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: (e.target.value || '') as NotificationListFiltersState['status'],
              }))
            }
            disabled={loadingList}
          >
            <option value="">Todos</option>
            {NOTIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {NOTIFICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field purchases-filter">
          <label htmlFor="admin-notif-tipo">Tipo</label>
          <select
            id="admin-notif-tipo"
            value={draft.tipo}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                tipo: (e.target.value || '') as NotificationListFiltersState['tipo'],
              }))
            }
            disabled={loadingList}
          >
            <option value="">Todos</option>
            {NOTIFICATION_TYPES.map((tipo) => (
              <option key={tipo} value={tipo}>
                {NOTIFICATION_TYPE_LABELS[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-notification-filters__actions">
          <button type="submit" className="btn-primary" disabled={loadingList}>
            Aplicar filtros
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              disabled={loadingList}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-notifications-layout">
        <section className="admin-notifications-list-panel">
          {loadingList ? <LoadingMessage label="Carregando notificações…" /> : null}

          {!loadingList && listError ? (
            <ErrorMessage
              message={listError}
              onRetry={() => void loadList(activeFilters)}
            />
          ) : null}

          {!loadingList && !listError && items.length === 0 ? (
            <EmptyMessage
              title={
                hasActiveFilters
                  ? 'Nenhuma notificação encontrada'
                  : 'Nenhuma notificação registrada'
              }
              message={
                hasActiveFilters
                  ? 'Ajuste os filtros ou limpe para ver todas.'
                  : 'Ainda não há notificações no sistema.'
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

          {!loadingList && !listError && items.length > 0 ? (
            <>
              <p className="catalog-count text-muted" role="status">
                {items.length} notificação{items.length === 1 ? '' : 'ões'}
              </p>
              <div className="admin-notification-list">
                {items.map((notification) => (
                  <AdminNotificationListItem
                    key={notification.id}
                    notification={notification}
                    selected={notification.id === selectedId}
                    onSelect={selectNotification}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="page-content admin-notifications-detail-panel" aria-live="polite">
          <h2 className="admin-form-subtitle">Detalhes</h2>

          {!selectedId ? (
            <p className="text-muted">
              Selecione uma notificação na lista para ver detalhes e atualizar o
              status.
            </p>
          ) : null}

          {selectedId && loadingDetail ? (
            <LoadingMessage label="Carregando detalhes…" />
          ) : null}

          {selectedId && detailNotFound ? (
            <>
              <ErrorMessage
                title="Notificação não encontrada"
                message="Ela pode ter sido removida ou o ID é inválido."
              />
              <button type="button" className="btn-secondary" onClick={clearSelection}>
                Fechar
              </button>
            </>
          ) : null}

          {selectedId && detailError && !loadingDetail ? (
            <ErrorMessage
              message={detailError}
              onRetry={() => void loadDetail(selectedId)}
            />
          ) : null}

          {selectedId && detail && !loadingDetail ? (
            <>
              <header className="purchase-detail__header admin-notification-detail__header">
                <div>
                  <h3>{NOTIFICATION_TYPE_LABELS[detail.tipo]}</h3>
                  <p className="text-muted">ID {detail.id}</p>
                </div>
                <NotificationStatusBadge status={detail.status} />
              </header>

              <dl className="detail-list">
                <dt>Data de envio</dt>
                <dd>{formatDateTime(detail.dataEnvio)}</dd>
                <dt>Cliente</dt>
                <dd>
                  <Link to={`/admin/clients/${detail.clienteId}`}>{detail.clienteId}</Link>
                </dd>
                <dt>Tipo</dt>
                <dd>{NOTIFICATION_TYPE_LABELS[detail.tipo]}</dd>
                <dt>Status</dt>
                <dd>
                  <NotificationStatusBadge status={detail.status} />
                </dd>
              </dl>

              <section>
                <h3>Mensagem</h3>
                <p className="admin-notification-message">{detail.mensagem}</p>
              </section>

              <section className="admin-notification-detail__status">
                <h3 className="admin-form-subtitle">Atualizar status</h3>
                <p className="text-muted">
                  Transições permitidas:{' '}
                  {allowedTransitions.length > 0
                    ? allowedTransitions
                        .map((s) => NOTIFICATION_STATUS_LABELS[s])
                        .join(', ')
                    : 'nenhuma (notificação finalizada).'}
                </p>

                {allowedTransitions.length > 0 ? (
                  <form className="vehicle-status-form" onSubmit={handleStatusSubmit}>
                    <div className="form-field">
                      <label htmlFor="admin-notif-status-draft">Novo status</label>
                      <select
                        id="admin-notif-status-draft"
                        value={statusDraft}
                        onChange={(e) =>
                          setStatusDraft(e.target.value as NotificationStatus)
                        }
                        disabled={statusSaving}
                      >
                        <option value={detail.status}>
                          {NOTIFICATION_STATUS_LABELS[detail.status]} (atual)
                        </option>
                        {allowedTransitions.map((status) => (
                          <option key={status} value={status}>
                            {NOTIFICATION_STATUS_LABELS[status]}
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
                    Não há alterações de status disponíveis.
                  </p>
                )}
              </section>

              <button type="button" className="btn-secondary" onClick={clearSelection}>
                Fechar detalhes
              </button>
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}