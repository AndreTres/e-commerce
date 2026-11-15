import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { listSales } from '../../api/salesApi'
import { useAuth } from '../../auth/AuthContext'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { SaleListItem } from '../../components/sales/SaleListItem'
import type { Sale, SaleStatus } from '../../types/sale'
import { SALE_STATUSES, SALE_STATUS_LABELS } from '../../types/sale'

const CLIENT_PROFILE_REQUIRED =
  'Authenticated client account is not linked to a customer record'

export function MyPurchasesPage() {
  const { getAccessToken } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPurchases = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await listSales(token, {
        status: statusFilter || undefined,
      })
      setSales(data)
    } catch (err) {
      let message = 'Não foi possível carregar suas compras.'
      if (err instanceof ApiError) {
        if (err.detail === CLIENT_PROFILE_REQUIRED) {
          message =
            'Sua conta não está vinculada a um cadastro de cliente. Contate a concessionária.'
        } else {
          message = err.detail
        }
      }
      setError(message)
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, statusFilter])

  useEffect(() => {
    void loadPurchases()
  }, [loadPurchases])

  return (
    <div className="account-stack">
      <header className="account-page-header">
        <h1>Minhas compras</h1>
        <p className="text-muted">Histórico de solicitações e vendas vinculadas à sua conta.</p>
      </header>

      <div className="page-content purchases-toolbar">
        <label className="form-field purchases-filter" htmlFor="purchase-status-filter">
          Filtrar por status
          <select
            id="purchase-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value || '') as SaleStatus | '')
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
        </label>
      </div>

      {loading ? <LoadingMessage label="Carregando compras…" /> : null}

      {!loading && error ? (
        <ErrorMessage message={error} onRetry={() => void loadPurchases()} />
      ) : null}

      {!loading && !error && sales.length === 0 ? (
        <EmptyMessage
          title="Nenhuma compra encontrada"
          message={
            statusFilter
              ? 'Não há compras com o status selecionado.'
              : 'Você ainda não possui compras registradas.'
          }
          action={
            <Link to="/vehicles" className="btn-secondary btn-secondary--inline">
              Explorar catálogo
            </Link>
          }
        />
      ) : null}

      {!loading && !error && sales.length > 0 ? (
        <div className="sale-list">
          {sales.map((sale) => (
            <SaleListItem key={sale.id} sale={sale} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
