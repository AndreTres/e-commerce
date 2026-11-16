import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FinanceSummaryBody } from '../../../api/types/finance'
import { getFinanceSummary, listPayments } from '../../../api/financeApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminSummaryCard } from '../../../components/admin/AdminSummaryCard'
import { AdminPaymentListItem } from '../../../components/finance/AdminPaymentListItem'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { Payment } from '../../../types/payment'
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from '../../../types/payment'
import { formatCurrency } from '../../../utils/format'
import { translateFinanceError } from '../financeErrors'
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  toListPaymentsOptions,
  type PaymentListFiltersState,
} from './parsePaymentListFilters'

const emptyFilters: PaymentListFiltersState = {
  status: '',
  vendaId: '',
}

export function AdminFinancePage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()

  const [draft, setDraft] = useState<PaymentListFiltersState>(() =>
    filtersFromSearchParams(searchParams),
  )
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  const [summary, setSummary] = useState<FinanceSummaryBody | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(filtersFromSearchParams(searchParams))
  }, [filterKey, searchParams])

  const loadSummary = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoadingSummary(false)
      return
    }

    setLoadingSummary(true)
    setSummaryError(null)

    try {
      const data = await getFinanceSummary(token)
      setSummary(data)
    } catch (err) {
      setSummary(null)
      setSummaryError(
        translateFinanceError(err, 'Não foi possível carregar o resumo financeiro.'),
      )
    } finally {
      setLoadingSummary(false)
    }
  }, [getAccessToken])

  const loadPayments = useCallback(
    async (filters: PaymentListFiltersState) => {
      const token = getAccessToken()
      if (!token) {
        setLoadingPayments(false)
        return
      }

      setLoadingPayments(true)
      setPaymentsError(null)

      try {
        const data = await listPayments(token, toListPaymentsOptions(filters))
        setPayments(data)
      } catch (err) {
        setPayments([])
        setPaymentsError(
          translateFinanceError(err, 'Não foi possível carregar os pagamentos.'),
        )
      } finally {
        setLoadingPayments(false)
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadPayments(filtersFromSearchParams(searchParams))
  }, [filterKey, loadPayments, searchParams])

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
    Boolean(activeFilters.status) || Boolean(activeFilters.vendaId.trim())

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão financeira</h1>
          <p className="text-muted">
            Resumo de pagamentos e listagem com filtros conforme a API financeira.
          </p>
        </div>
      </header>

      <section className="page-content admin-finance-summary">
        <h2 className="admin-form-subtitle">Resumo</h2>
        {loadingSummary ? <LoadingMessage label="Carregando resumo…" /> : null}
        {summaryError ? (
          <ErrorMessage
            message={summaryError}
            onRetry={() => void loadSummary()}
          />
        ) : null}
        {!loadingSummary && !summaryError && summary ? (
          <div className="admin-summary-grid">
            <AdminSummaryCard
              label="Total de pagamentos"
              value={String(summary.total_payments)}
            />
            <AdminSummaryCard
              label="Valor aprovado"
              value={formatCurrency(summary.approved_payments_value)}
            />
            <AdminSummaryCard
              label="Valor pendente"
              value={formatCurrency(summary.pending_payments_value)}
            />
            <AdminSummaryCard
              label="Valor recusado"
              value={formatCurrency(summary.rejected_payments_value)}
            />
            <AdminSummaryCard
              label="Valor cancelado"
              value={formatCurrency(summary.cancelled_payments_value)}
            />
          </div>
        ) : null}
      </section>

      <form className="admin-finance-filters page-content" onSubmit={handleFilterSubmit}>
        <div className="form-field purchases-filter">
          <label htmlFor="admin-payment-status">Status</label>
          <select
            id="admin-payment-status"
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: (e.target.value || '') as PaymentListFiltersState['status'],
              }))
            }
            disabled={loadingPayments}
          >
            <option value="">Todos</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="admin-payment-venda-id">ID da venda</label>
          <input
            id="admin-payment-venda-id"
            value={draft.vendaId}
            onChange={(e) => setDraft((prev) => ({ ...prev, vendaId: e.target.value }))}
            placeholder="UUID da venda"
            disabled={loadingPayments}
            autoComplete="off"
          />
        </div>
        <div className="admin-finance-filters__actions">
          <button type="submit" className="btn-primary" disabled={loadingPayments}>
            Aplicar filtros
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              disabled={loadingPayments}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </form>

      {loadingPayments ? <LoadingMessage label="Carregando pagamentos…" /> : null}

      {!loadingPayments && paymentsError ? (
        <ErrorMessage
          message={paymentsError}
          onRetry={() => void loadPayments(activeFilters)}
        />
      ) : null}

      {!loadingPayments && !paymentsError && payments.length === 0 ? (
        <EmptyMessage
          title={hasActiveFilters ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento registrado'}
          message={
            hasActiveFilters
              ? 'Ajuste os filtros ou limpe para ver todos os pagamentos.'
              : 'Ainda não há pagamentos no sistema.'
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

      {!loadingPayments && !paymentsError && payments.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {payments.length} pagamento{payments.length === 1 ? '' : 's'}
          </p>
          <div className="admin-payment-list">
            {payments.map((payment) => (
              <AdminPaymentListItem key={payment.id} payment={payment} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}