import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  FinanceSummaryBody,
  SalesReportBody,
  VehicleInventoryReportBody,
} from '../../../api/types/reports'
import {
  getFinancialReport,
  getSalesReport,
  getVehicleInventoryReport,
} from '../../../api/reportsApi'
import { useAuth } from '../../../auth/AuthContext'
import { AdminSummaryCard } from '../../../components/admin/AdminSummaryCard'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import { SALE_STATUS_LABELS, type SaleStatus } from '../../../types/sale'
import { VEHICLE_STATUS_LABELS } from '../../../types/vehicle'
import { formatCurrency } from '../../../utils/format'
import { translateReportError } from '../reportErrors'
import {
  dateFiltersFromSearchParams,
  searchParamsFromDateFilters,
  toApiDateRange,
  validateDateFilters,
  type ReportDateFilterState,
} from './reportDateRange'

const emptyDateFilters: ReportDateFilterState = {
  startDate: '',
  endDate: '',
}

type LoadState<T> = {
  loading: boolean
  error: string | null
  data: T | null
}

function emptyLoadState<T>(): LoadState<T> {
  return { loading: false, error: null, data: null }
}

export function AdminReportsPage() {
  const { getAccessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()

  const [draftDates, setDraftDates] = useState<ReportDateFilterState>(() =>
    dateFiltersFromSearchParams(searchParams),
  )
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)

  const [sales, setSales] = useState(emptyLoadState<SalesReportBody>())
  const [inventory, setInventory] = useState(emptyLoadState<VehicleInventoryReportBody>())
  const [finance, setFinance] = useState(emptyLoadState<FinanceSummaryBody>())

  const activeDates = dateFiltersFromSearchParams(searchParams)
  const hasDateFilter = Boolean(activeDates.startDate) || Boolean(activeDates.endDate)

  useEffect(() => {
    setDraftDates(dateFiltersFromSearchParams(searchParams))
  }, [filterKey, searchParams])

  const loadReports = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      return
    }

    const dates = dateFiltersFromSearchParams(searchParams)
    const validation = validateDateFilters(dates)
    if (validation) {
      setDateValidationError(validation)
      setSales(emptyLoadState())
      setInventory(emptyLoadState())
      setFinance(emptyLoadState())
      return
    }

    setDateValidationError(null)
    const range = toApiDateRange(dates)

    setSales({ loading: true, error: null, data: null })
    setInventory({ loading: true, error: null, data: null })
    setFinance({ loading: true, error: null, data: null })

    const salesPromise = getSalesReport(token, range)
      .then((data) => setSales({ loading: false, error: null, data }))
      .catch((err) =>
        setSales({
          loading: false,
          error: translateReportError(err, 'Não foi possível carregar o relatório de vendas.'),
          data: null,
        }),
      )

    const inventoryPromise = getVehicleInventoryReport(token)
      .then((data) => setInventory({ loading: false, error: null, data }))
      .catch((err) =>
        setInventory({
          loading: false,
          error: translateReportError(
            err,
            'Não foi possível carregar o relatório de estoque.',
          ),
          data: null,
        }),
      )

    const financePromise = getFinancialReport(token, range)
      .then((data) => setFinance({ loading: false, error: null, data }))
      .catch((err) =>
        setFinance({
          loading: false,
          error: translateReportError(err, 'Não foi possível carregar o relatório financeiro.'),
          data: null,
        }),
      )

    await Promise.all([salesPromise, inventoryPromise, financePromise])
  }, [filterKey, getAccessToken, searchParams])

  useEffect(() => {
    void loadReports()
  }, [loadReports, filterKey])

  function handleDateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateDateFilters(draftDates)
    if (validation) {
      setDateValidationError(validation)
      return
    }
    setDateValidationError(null)
    setSearchParams(searchParamsFromDateFilters(draftDates), { replace: true })
  }

  function clearDateFilters() {
    setDraftDates(emptyDateFilters)
    setDateValidationError(null)
    setSearchParams({}, { replace: true })
  }

  const anyLoading = sales.loading || inventory.loading || finance.loading
  const allFailed =
    !anyLoading &&
    Boolean(sales.error) &&
    Boolean(inventory.error) &&
    Boolean(finance.error)

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Relatórios</h1>
          <p className="text-muted">
            Indicadores de vendas, estoque de veículos e financeiro. Vendas e financeiro
            aceitam filtro por período; estoque reflete o momento atual.
          </p>
        </div>
      </header>

      <form className="admin-reports-date-filters page-content" onSubmit={handleDateSubmit}>
        <p className="text-muted admin-reports-date-filters__hint">
          Período aplicado aos relatórios de vendas e financeiro.
        </p>
        <div className="admin-reports-date-filters__fields">
          <div className="form-field">
            <label htmlFor="reports-start-date">Data inicial</label>
            <input
              id="reports-start-date"
              type="date"
              value={draftDates.startDate}
              onChange={(e) =>
                setDraftDates((prev) => ({ ...prev, startDate: e.target.value }))
              }
              disabled={anyLoading}
            />
          </div>
          <div className="form-field">
            <label htmlFor="reports-end-date">Data final</label>
            <input
              id="reports-end-date"
              type="date"
              value={draftDates.endDate}
              onChange={(e) => setDraftDates((prev) => ({ ...prev, endDate: e.target.value }))}
              disabled={anyLoading}
            />
          </div>
        </div>
        <div className="admin-reports-date-filters__actions">
          <button type="submit" className="btn-primary" disabled={anyLoading}>
            Aplicar período
          </button>
          {hasDateFilter ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearDateFilters}
              disabled={anyLoading}
            >
              Limpar período
            </button>
          ) : null}
        </div>
        {dateValidationError ? (
          <p className="form-error" role="alert">
            {dateValidationError}
          </p>
        ) : null}
      </form>

      {anyLoading ? <LoadingMessage label="Carregando relatórios…" /> : null}

      {allFailed ? (
        <ErrorMessage
          message="Não foi possível carregar os relatórios."
          onRetry={() => void loadReports()}
        />
      ) : null}

      <SalesReportSection
        state={sales}
        hasDateFilter={hasDateFilter}
        onRetry={() => void loadReports()}
      />

      <InventoryReportSection state={inventory} onRetry={() => void loadReports()} />

      <FinanceReportSection
        state={finance}
        hasDateFilter={hasDateFilter}
        onRetry={() => void loadReports()}
      />
    </div>
  )
}

type SectionProps<T> = {
  state: LoadState<T>
  onRetry: () => void
  hasDateFilter?: boolean
}

function SalesReportSection({
  state,
  hasDateFilter,
  onRetry,
}: SectionProps<SalesReportBody>) {
  const rows: { key: SaleStatus | 'total'; label: string; count: number; value?: string }[] =
    state.data
      ? [
          { key: 'PENDENTE', label: SALE_STATUS_LABELS.PENDENTE, count: state.data.pending_sales },
          {
            key: 'EM_PROCESSAMENTO',
            label: SALE_STATUS_LABELS.EM_PROCESSAMENTO,
            count: state.data.processing_sales,
          },
          {
            key: 'CONCLUIDA',
            label: SALE_STATUS_LABELS.CONCLUIDA,
            count: state.data.completed_sales,
            value: formatCurrency(state.data.completed_sales_value),
          },
          {
            key: 'CANCELADA',
            label: SALE_STATUS_LABELS.CANCELADA,
            count: state.data.cancelled_sales,
          },
          { key: 'total', label: 'Total', count: state.data.total_sales },
        ]
      : []

  return (
    <ReportSection title="Relatório de vendas">
      {state.loading ? <LoadingMessage label="Carregando vendas…" /> : null}
      {state.error ? <ErrorMessage message={state.error} onRetry={onRetry} /> : null}
      {!state.loading && !state.error && state.data?.total_sales === 0 ? (
        <EmptyMessage
          title="Nenhuma venda no período"
          message={
            hasDateFilter
              ? 'Não há vendas registradas para o intervalo selecionado.'
              : 'Ainda não há vendas registradas no sistema.'
          }
        />
      ) : null}
      {!state.loading && !state.error && state.data && state.data.total_sales > 0 ? (
        <>
          <div className="admin-summary-grid">
            <AdminSummaryCard label="Total de vendas" value={String(state.data.total_sales)} />
            <AdminSummaryCard
              label="Valor concluído"
              value={formatCurrency(state.data.completed_sales_value)}
            />
            <AdminSummaryCard
              label="Concluídas"
              value={String(state.data.completed_sales)}
            />
            <AdminSummaryCard
              label="Pendentes"
              value={String(state.data.pending_sales)}
            />
          </div>
          <ReportsTable
            headers={['Status', 'Quantidade', 'Valor (concluídas)']}
            rows={rows.map((row) => [
              row.label,
              String(row.count),
              row.value ?? '-',
            ])}
          />
        </>
      ) : null}
    </ReportSection>
  )
}

function InventoryReportSection({
  state,
  onRetry,
}: SectionProps<VehicleInventoryReportBody>) {
  const data = state.data
  const barRows = data
    ? [
        { label: VEHICLE_STATUS_LABELS.DISPONIVEL, count: data.available_vehicles },
        { label: VEHICLE_STATUS_LABELS.RESERVADO, count: data.reserved_vehicles },
        { label: VEHICLE_STATUS_LABELS.VENDIDO, count: data.sold_vehicles },
        { label: VEHICLE_STATUS_LABELS.INDISPONIVEL, count: data.unavailable_vehicles },
      ]
    : []
  const maxCount = Math.max(...barRows.map((r) => r.count), 1)

  return (
    <ReportSection title="Relatório de estoque de veículos">
      {state.loading ? <LoadingMessage label="Carregando estoque…" /> : null}
      {state.error ? <ErrorMessage message={state.error} onRetry={onRetry} /> : null}
      {!state.loading && !state.error && data?.total_vehicles === 0 ? (
        <EmptyMessage
          title="Nenhum veículo cadastrado"
          message="O estoque está vazio."
        />
      ) : null}
      {!state.loading && !state.error && data && data.total_vehicles > 0 ? (
        <>
          <div className="admin-summary-grid">
            <AdminSummaryCard label="Total de veículos" value={String(data.total_vehicles)} />
            <AdminSummaryCard label="Disponíveis" value={String(data.available_vehicles)} />
            <AdminSummaryCard
              label="Valor do estoque ativo"
              value={formatCurrency(data.inventory_value)}
              hint="Soma de disponíveis e reservados"
            />
          </div>
          <ReportsTable
            headers={['Status', 'Quantidade']}
            rows={barRows.map((row) => [row.label, String(row.count)])}
          />
          <div className="reports-bar-chart" role="img" aria-label="Distribuição por status">
            {barRows.map((row) => (
              <div key={row.label} className="reports-bar-chart__row">
                <span className="reports-bar-chart__label">{row.label}</span>
                <div className="reports-bar-chart__track">
                  <span
                    className="reports-bar-chart__bar"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="reports-bar-chart__value">{row.count}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </ReportSection>
  )
}

function FinanceReportSection({
  state,
  hasDateFilter,
  onRetry,
}: SectionProps<FinanceSummaryBody>) {
  const data = state.data

  return (
    <ReportSection title="Relatório financeiro (pagamentos)">
      {state.loading ? <LoadingMessage label="Carregando financeiro…" /> : null}
      {state.error ? <ErrorMessage message={state.error} onRetry={onRetry} /> : null}
      {!state.loading && !state.error && data?.total_payments === 0 ? (
        <EmptyMessage
          title="Nenhum pagamento no período"
          message={
            hasDateFilter
              ? 'Não há pagamentos no intervalo selecionado.'
              : 'Ainda não há pagamentos registrados.'
          }
        />
      ) : null}
      {!state.loading && !state.error && data && data.total_payments > 0 ? (
        <>
          <div className="admin-summary-grid">
            <AdminSummaryCard label="Total de pagamentos" value={String(data.total_payments)} />
            <AdminSummaryCard
              label="Aprovados"
              value={formatCurrency(data.approved_payments_value)}
            />
            <AdminSummaryCard
              label="Pendentes"
              value={formatCurrency(data.pending_payments_value)}
            />
            <AdminSummaryCard
              label="Recusados"
              value={formatCurrency(data.rejected_payments_value)}
            />
          </div>
          <ReportsTable
            headers={['Indicador', 'Valor']}
            rows={[
              ['Pagamentos (quantidade)', String(data.total_payments)],
              ['Valor aprovado', formatCurrency(data.approved_payments_value)],
              ['Valor pendente', formatCurrency(data.pending_payments_value)],
              ['Valor recusado', formatCurrency(data.rejected_payments_value)],
              ['Valor cancelado', formatCurrency(data.cancelled_payments_value)],
            ]}
          />
        </>
      ) : null}
    </ReportSection>
  )
}

function ReportSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="page-content admin-reports-section">
      <h2 className="admin-form-subtitle">{title}</h2>
      {children}
    </section>
  )
}

function ReportsTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}