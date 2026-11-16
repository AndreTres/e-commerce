import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listSales } from '../../../api/salesApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminSaleListItem } from '../../../components/sales/AdminSaleListItem'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { Sale } from '../../../types/sale'
import { SALE_STATUSES, SALE_STATUS_LABELS } from '../../../types/sale'
import { translateSaleError } from '../saleErrors'
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  toListSalesOptions,
  type SaleListFiltersState,
} from './parseSaleListFilters'

const emptyFilters: SaleListFiltersState = {
  status: '',
  clienteId: '',
  veiculoId: '',
}

export function AdminSalesListPage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const activeFilters = filtersFromSearchParams(searchParams)

  const [draft, setDraft] = useState<SaleListFiltersState>(() =>
    filtersFromSearchParams(searchParams),
  )
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(filtersFromSearchParams(searchParams))
  }, [filterKey, searchParams])

  const loadSales = useCallback(
    async (filters: SaleListFiltersState) => {
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await listSales(token, toListSalesOptions(filters))
        setSales(data)
      } catch (err) {
        setSales([])
        setError(translateSaleError(err, 'Não foi possível carregar as vendas.'))
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void loadSales(filtersFromSearchParams(searchParams))
  }, [filterKey, loadSales, searchParams])

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchParams(searchParamsFromFilters(draft), { replace: true })
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters =
    Boolean(activeFilters.status) ||
    Boolean(activeFilters.clienteId.trim()) ||
    Boolean(activeFilters.veiculoId.trim())

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão de vendas</h1>
          <p className="text-muted">
            Filtre por status, cliente ou veículo conforme os parâmetros suportados pela API.
          </p>
        </div>
      </header>

      <form className="admin-sale-filters page-content" onSubmit={handleFilterSubmit}>
        <div className="form-field purchases-filter">
          <label htmlFor="admin-sale-status">Status</label>
          <select
            id="admin-sale-status"
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: (e.target.value || '') as SaleListFiltersState['status'],
              }))
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {SALE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SALE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="admin-sale-cliente-id">ID do cliente</label>
          <input
            id="admin-sale-cliente-id"
            value={draft.clienteId}
            onChange={(e) => setDraft((prev) => ({ ...prev, clienteId: e.target.value }))}
            placeholder="UUID do cliente"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="admin-sale-veiculo-id">ID do veículo</label>
          <input
            id="admin-sale-veiculo-id"
            value={draft.veiculoId}
            onChange={(e) => setDraft((prev) => ({ ...prev, veiculoId: e.target.value }))}
            placeholder="UUID do veículo"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <div className="admin-sale-filters__actions">
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

      {loading ? <LoadingMessage label="Carregando vendas…" /> : null}

      {!loading && error ? (
        <ErrorMessage
          message={error}
          onRetry={() => void loadSales(activeFilters)}
        />
      ) : null}

      {!loading && !error && sales.length === 0 ? (
        <EmptyMessage
          title={hasActiveFilters ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
          message={
            hasActiveFilters
              ? 'Ajuste os filtros ou limpe para ver todas as vendas.'
              : 'Ainda não há vendas no sistema.'
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

      {!loading && !error && sales.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {sales.length} venda{sales.length === 1 ? '' : 's'}
          </p>
          <div className="sale-list">
            {sales.map((sale) => (
              <AdminSaleListItem key={sale.id} sale={sale} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}