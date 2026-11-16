import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listClients } from '../../../api/clientsApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminClientListItem } from '../../../components/clients/AdminClientListItem'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { ClientProfile } from '../../../types/client'
import { translateClientError } from '../clientErrors'

export function AdminClientsListPage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const filterKey = search

  const [draftSearch, setDraftSearch] = useState(search)
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraftSearch(search)
  }, [search])

  const loadClients = useCallback(
    async (query: string) => {
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await listClients(token, query || undefined)
        setClients(data)
      } catch (err) {
        const message = translateClientError(
          err,
          'Não foi possível carregar os clientes.',
        )
        setError(message)
        setClients([])
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void loadClients(search)
  }, [filterKey, loadClients, search])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draftSearch.trim()
    if (trimmed) {
      setSearchParams({ search: trimmed }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  function clearSearch() {
    setDraftSearch('')
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão de clientes</h1>
          <p className="text-muted">
            Busque por nome, e-mail ou CPF/CNPJ (dígitos) conforme a API de listagem.
          </p>
        </div>
      </header>

      <form className="admin-client-search" onSubmit={handleSearchSubmit}>
        <div className="form-field admin-client-search__field">
          <label htmlFor="admin-client-search">Buscar cliente</label>
          <input
            id="admin-client-search"
            type="search"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Nome, e-mail ou documento"
            maxLength={255}
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <div className="admin-client-search__actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            Buscar
          </button>
          {search ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearSearch}
              disabled={loading}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingMessage label="Carregando clientes…" /> : null}

      {!loading && error ? (
        <ErrorMessage
          message={error}
          onRetry={() => void loadClients(search)}
        />
      ) : null}

      {!loading && !error && clients.length === 0 ? (
        <EmptyMessage
          title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          message={
            search
              ? 'Tente outros termos de busca ou limpe o filtro.'
              : 'Ainda não há clientes no sistema.'
          }
          action={
            search ? (
              <button type="button" className="btn-secondary" onClick={clearSearch}>
                Limpar busca
              </button>
            ) : undefined
          }
        />
      ) : null}

      {!loading && !error && clients.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {clients.length} cliente{clients.length === 1 ? '' : 's'}
            {search ? ` para “${search}”` : ''}
          </p>
          <div className="admin-client-list">
            {clients.map((client) => (
              <AdminClientListItem key={client.id} client={client} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}