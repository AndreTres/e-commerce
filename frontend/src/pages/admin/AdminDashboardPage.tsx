import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import type { FinanceSummaryBody } from '../../api/types/finance'
import type { SalesReportBody, VehicleInventoryReportBody } from '../../api/types/reports'
import { listClients } from '../../api/clientsApi'
import { getFinanceSummary, listPayments } from '../../api/financeApi'
import {
  getFinancialReport,
  getSalesReport,
  getVehicleInventoryReport,
} from '../../api/reportsApi'
import { listSales } from '../../api/salesApi'
import { listTestDrives } from '../../api/testDrivesApi'
import { AdminSummaryCard } from '../../components/admin/AdminSummaryCard'
import { ErrorMessage, LoadingMessage } from '../../components/feedback/AsyncFeedback'
import { SaleStatusBadge } from '../../components/sales/SaleStatusBadge'
import {
  getAdminPermissions,
  hasAdminPermission,
  type AdminPermission,
} from '../../config/adminPermissions'
import { useAuth } from '../../auth/AuthContext'
import type { Payment } from '../../types/payment'
import { PAYMENT_STATUS_LABELS } from '../../types/payment'
import type { Sale } from '../../types/sale'
import type { TestDrive } from '../../types/testDrive'
import type { UserRole } from '../../types/user'
import { formatCurrency, formatDateTime } from '../../utils/format'

const RECENT_LIMIT = 5

type SectionState<T> = {
  loading: boolean
  error: string | null
  data: T | null
}

function emptySection<T>(): SectionState<T> {
  return { loading: false, error: null, data: null }
}

function sectionError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return 'Sem permissão para este resumo.'
    }
    return err.detail || fallback
  }
  return fallback
}

export function AdminDashboardPage() {
  const { user, getAccessToken } = useAuth()
  const role = user?.role as UserRole | undefined
  const permissions = role ? getAdminPermissions(role) : []

  const [pageLoading, setPageLoading] = useState(true)

  const [salesReport, setSalesReport] = useState(emptySection<SalesReportBody>())
  const [inventoryReport, setInventoryReport] = useState(
    emptySection<VehicleInventoryReportBody>(),
  )
  const [reportsFinance, setReportsFinance] = useState(emptySection<FinanceSummaryBody>())
  const [financeSummary, setFinanceSummary] = useState(emptySection<FinanceSummaryBody>())

  const [recentSales, setRecentSales] = useState(emptySection<Sale[]>())
  const [salesTotal, setSalesTotal] = useState<number | null>(null)
  const [recentTestDrives, setRecentTestDrives] = useState(emptySection<TestDrive[]>())
  const [recentPayments, setRecentPayments] = useState(emptySection<Payment[]>())
  const [clientCount, setClientCount] = useState(emptySection<number>())

  const loadDashboard = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !role) {
      setPageLoading(false)
      return
    }

    setPageLoading(true)
    const tasks: Promise<void>[] = []

    if (hasAdminPermission(role, 'reports')) {
      setSalesReport({ loading: true, error: null, data: null })
      tasks.push(
        getSalesReport(token)
          .then((data) => setSalesReport({ loading: false, error: null, data }))
          .catch((err) =>
            setSalesReport({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar relatório de vendas.'),
              data: null,
            }),
          ),
      )

      setInventoryReport({ loading: true, error: null, data: null })
      tasks.push(
        getVehicleInventoryReport(token)
          .then((data) => setInventoryReport({ loading: false, error: null, data }))
          .catch((err) =>
            setInventoryReport({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar relatório de estoque.'),
              data: null,
            }),
          ),
      )

      setReportsFinance({ loading: true, error: null, data: null })
      tasks.push(
        getFinancialReport(token)
          .then((data) => setReportsFinance({ loading: false, error: null, data }))
          .catch((err) =>
            setReportsFinance({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar relatório financeiro.'),
              data: null,
            }),
          ),
      )
    }

    if (hasAdminPermission(role, 'finance') && !hasAdminPermission(role, 'reports')) {
      setFinanceSummary({ loading: true, error: null, data: null })
      tasks.push(
        getFinanceSummary(token)
          .then((data) => setFinanceSummary({ loading: false, error: null, data }))
          .catch((err) =>
            setFinanceSummary({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar resumo financeiro.'),
              data: null,
            }),
          ),
      )
    }

    if (hasAdminPermission(role, 'sales')) {
      setRecentSales({ loading: true, error: null, data: null })
      tasks.push(
        listSales(token)
          .then((data) => {
            setSalesTotal(data.length)
            const sorted = [...data].sort(
              (a, b) =>
                new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime(),
            )
            setRecentSales({
              loading: false,
              error: null,
              data: sorted.slice(0, RECENT_LIMIT),
            })
          })
          .catch((err) =>
            setRecentSales({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar vendas recentes.'),
              data: null,
            }),
          ),
      )
    }

    if (hasAdminPermission(role, 'test_drives')) {
      setRecentTestDrives({ loading: true, error: null, data: null })
      tasks.push(
        listTestDrives(token)
          .then((data) => {
            const sorted = [...data].sort(
              (a, b) =>
                new Date(b.dataAgendamento).getTime() -
                new Date(a.dataAgendamento).getTime(),
            )
            setRecentTestDrives({
              loading: false,
              error: null,
              data: sorted.slice(0, RECENT_LIMIT),
            })
          })
          .catch((err) =>
            setRecentTestDrives({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar test drives recentes.'),
              data: null,
            }),
          ),
      )
    }

    if (hasAdminPermission(role, 'finance')) {
      setRecentPayments({ loading: true, error: null, data: null })
      tasks.push(
        listPayments(token)
          .then((data) => {
            const sorted = [...data].sort(
              (a, b) =>
                new Date(b.dataPagamento).getTime() -
                new Date(a.dataPagamento).getTime(),
            )
            setRecentPayments({
              loading: false,
              error: null,
              data: sorted.slice(0, RECENT_LIMIT),
            })
          })
          .catch((err) =>
            setRecentPayments({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar pagamentos recentes.'),
              data: null,
            }),
          ),
      )
    }

    if (hasAdminPermission(role, 'clients')) {
      setClientCount({ loading: true, error: null, data: null })
      tasks.push(
        listClients(token)
          .then((data) =>
            setClientCount({ loading: false, error: null, data: data.length }),
          )
          .catch((err) =>
            setClientCount({
              loading: false,
              error: sectionError(err, 'Não foi possível carregar clientes.'),
              data: null,
            }),
          ),
      )
    }

    await Promise.all(tasks)
    setPageLoading(false)
  }, [getAccessToken, role])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const showReportsBlock = role ? hasAdminPermission(role, 'reports') : false
  const showFinanceOnly =
    role && hasAdminPermission(role, 'finance') && !showReportsBlock
  const showSellerOps =
    role &&
    !showReportsBlock &&
    !showFinanceOnly &&
    hasAdminPermission(role, 'sales')

  if (pageLoading) {
    return <LoadingMessage label="Carregando painel…" />
  }

  return (
    <div className="account-stack admin-dashboard">
      <header className="account-page-header">
        <h1>Painel administrativo</h1>
        <p className="text-muted">
          Visão operacional para {user?.email ?? 'colaborador'} ({user?.role}).
        </p>
      </header>

      {showReportsBlock ? (
        <ReportsSummarySection
          sales={salesReport}
          inventory={inventoryReport}
          finance={reportsFinance}
        />
      ) : null}

      {showFinanceOnly ? (
        <FinanceSummarySection summary={financeSummary} showFinanceLink />
      ) : null}

      {showSellerOps ? (
        <OperationalCountsSection
          clientCount={clientCount}
          salesTotal={salesTotal}
        />
      ) : null}

      {showReportsBlock ? (
        <p className="admin-dashboard__link">
          <Link to="/admin/reports">Abrir relatórios completos</Link>
        </p>
      ) : null}

      {role && hasAdminPermission(role, 'sales') ? (
        <RecentSalesSection state={recentSales} />
      ) : null}

      {role && hasAdminPermission(role, 'test_drives') ? (
        <RecentTestDrivesSection state={recentTestDrives} />
      ) : null}

      {role && hasAdminPermission(role, 'finance') ? (
        <RecentPaymentsSection state={recentPayments} />
      ) : null}

      <QuickLinksSection permissions={permissions} />
    </div>
  )
}

function ReportsSummarySection({
  sales,
  inventory,
  finance,
}: {
  sales: SectionState<SalesReportBody>
  inventory: SectionState<VehicleInventoryReportBody>
  finance: SectionState<FinanceSummaryBody>
}) {
  const anyLoading = sales.loading || inventory.loading || finance.loading
  const hasData = sales.data || inventory.data || finance.data

  return (
    <section className="page-content admin-dashboard-section">
      <h2>Indicadores (relatórios)</h2>
      {anyLoading ? <LoadingMessage label="Carregando indicadores…" /> : null}

      {!anyLoading && !hasData && !sales.error && !inventory.error && !finance.error ? (
        <p className="text-muted">Nenhum indicador disponível no momento.</p>
      ) : null}

      {sales.error ? <p className="form-error">{sales.error}</p> : null}
      {inventory.error ? <p className="form-error">{inventory.error}</p> : null}
      {finance.error ? <p className="form-error">{finance.error}</p> : null}

      {!anyLoading && hasData ? (
        <div className="admin-summary-grid">
          {sales.data ? (
            <>
              <AdminSummaryCard label="Total de vendas" value={String(sales.data.total_sales)} />
              <AdminSummaryCard
                label="Vendas concluídas"
                value={String(sales.data.completed_sales)}
              />
              <AdminSummaryCard
                label="Valor vendas concluídas"
                value={formatCurrency(sales.data.completed_sales_value)}
              />
              <AdminSummaryCard
                label="Vendas pendentes"
                value={String(sales.data.pending_sales)}
              />
            </>
          ) : null}

          {inventory.data ? (
            <>
              <AdminSummaryCard
                label="Veículos no estoque"
                value={String(inventory.data.total_vehicles)}
              />
              <AdminSummaryCard
                label="Disponíveis"
                value={String(inventory.data.available_vehicles)}
              />
              <AdminSummaryCard
                label="Valor do estoque"
                value={formatCurrency(inventory.data.inventory_value)}
              />
            </>
          ) : null}

          {finance.data ? (
            <>
              <AdminSummaryCard
                label="Total de pagamentos"
                value={String(finance.data.total_payments)}
              />
              <AdminSummaryCard
                label="Pagamentos aprovados"
                value={formatCurrency(finance.data.approved_payments_value)}
              />
              <AdminSummaryCard
                label="Pagamentos pendentes"
                value={formatCurrency(finance.data.pending_payments_value)}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function FinanceSummarySection({
  summary,
  showFinanceLink,
}: {
  summary: SectionState<FinanceSummaryBody>
  showFinanceLink: boolean
}) {
  return (
    <section className="page-content admin-dashboard-section">
      <h2>Resumo financeiro</h2>
      {summary.loading ? <LoadingMessage label="Carregando resumo…" /> : null}
      {summary.error ? <ErrorMessage message={summary.error} /> : null}
      {summary.data ? (
        <div className="admin-summary-grid">
          <AdminSummaryCard
            label="Total de pagamentos"
            value={String(summary.data.total_payments)}
          />
          <AdminSummaryCard
            label="Aprovados"
            value={formatCurrency(summary.data.approved_payments_value)}
          />
          <AdminSummaryCard
            label="Pendentes"
            value={formatCurrency(summary.data.pending_payments_value)}
          />
          <AdminSummaryCard
            label="Recusados"
            value={formatCurrency(summary.data.rejected_payments_value)}
          />
        </div>
      ) : null}
      {!summary.loading && !summary.data && !summary.error ? (
        <p className="text-muted">Sem dados financeiros para exibir.</p>
      ) : null}
      {showFinanceLink ? (
        <p className="admin-dashboard__link">
          <Link to="/admin/finance">Ir para gestão financeira</Link>
        </p>
      ) : null}
    </section>
  )
}

function OperationalCountsSection({
  clientCount,
  salesTotal,
}: {
  clientCount: SectionState<number>
  salesTotal: number | null
}) {
  return (
    <section className="page-content admin-dashboard-section">
      <h2>Resumo operacional</h2>
      <div className="admin-summary-grid">
        {clientCount.data !== null && !clientCount.error ? (
          <AdminSummaryCard
            label="Clientes cadastrados"
            value={String(clientCount.data)}
          />
        ) : null}
        {salesTotal !== null ? (
          <AdminSummaryCard label="Vendas registradas" value={String(salesTotal)} />
        ) : null}
      </div>
      {clientCount.loading ? <LoadingMessage label="Carregando contagens…" /> : null}
      {clientCount.error ? <p className="form-error">{clientCount.error}</p> : null}
    </section>
  )
}

function RecentSalesSection({ state }: { state: SectionState<Sale[]> }) {
  return (
    <section className="admin-dashboard-section">
      <div className="section-heading admin-section-heading">
        <h2>Vendas recentes</h2>
        <Link to="/admin/sales">Ver todas</Link>
      </div>
      {state.loading ? <LoadingMessage /> : null}
      {state.error ? <ErrorMessage message={state.error} /> : null}
      {!state.loading && !state.error && state.data?.length === 0 ? (
        <p className="text-muted">Nenhuma venda registrada.</p>
      ) : null}
      {state.data && state.data.length > 0 ? (
        <ul className="admin-recent-list">
          {state.data.map((sale) => (
            <li key={sale.id}>
              <Link to={`/admin/sales/${sale.id}`}>
                {sale.veiculo.marca} {sale.veiculo.modelo}
              </Link>
              <span className="text-muted">
                {' '}
                · {formatDateTime(sale.dataVenda)} · {formatCurrency(sale.valorTotal)}
              </span>
              <SaleStatusBadge status={sale.status} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function RecentTestDrivesSection({ state }: { state: SectionState<TestDrive[]> }) {
  return (
    <section className="admin-dashboard-section">
      <div className="section-heading admin-section-heading">
        <h2>Test drives recentes</h2>
        <Link to="/admin/test-drives">Ver todos</Link>
      </div>
      {state.loading ? <LoadingMessage /> : null}
      {state.error ? <ErrorMessage message={state.error} /> : null}
      {!state.loading && !state.error && state.data?.length === 0 ? (
        <p className="text-muted">Nenhum agendamento encontrado.</p>
      ) : null}
      {state.data && state.data.length > 0 ? (
        <ul className="admin-recent-list">
          {state.data.map((item) => (
            <li key={item.id}>
              <Link to={`/admin/test-drives/${item.id}`}>
                {item.veiculo.marca} {item.veiculo.modelo}
              </Link>
              <span className="text-muted">
                {' '}
                · {formatDateTime(item.dataAgendamento)} · {item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function RecentPaymentsSection({ state }: { state: SectionState<Payment[]> }) {
  return (
    <section className="admin-dashboard-section">
      <div className="section-heading admin-section-heading">
        <h2>Pagamentos recentes</h2>
        <Link to="/admin/finance">Ver financeiro</Link>
      </div>
      {state.loading ? <LoadingMessage /> : null}
      {state.error ? <ErrorMessage message={state.error} /> : null}
      {!state.loading && !state.error && state.data?.length === 0 ? (
        <p className="text-muted">Nenhum pagamento registrado.</p>
      ) : null}
      {state.data && state.data.length > 0 ? (
        <ul className="admin-recent-list">
          {state.data.map((payment) => (
            <li key={payment.id}>
              <Link to={`/admin/finance/payments/${payment.id}`}>
                {formatCurrency(payment.valor)}
              </Link>
              <span className="text-muted">
                {' '}
                · {PAYMENT_STATUS_LABELS[payment.status]} ·{' '}
                {formatDateTime(payment.dataPagamento)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function QuickLinksSection({ permissions }: { permissions: AdminPermission[] }) {
  const links = [
    { perm: 'vehicles' as const, to: '/admin/vehicles', label: 'Veículos' },
    { perm: 'clients' as const, to: '/admin/clients', label: 'Clientes' },
    { perm: 'sales' as const, to: '/admin/sales', label: 'Vendas' },
    { perm: 'test_drives' as const, to: '/admin/test-drives', label: 'Test drives' },
    { perm: 'finance' as const, to: '/admin/finance', label: 'Financeiro' },
    { perm: 'notifications' as const, to: '/admin/notifications', label: 'Notificações' },
    { perm: 'reports' as const, to: '/admin/reports', label: 'Relatórios' },
  ].filter((link) => permissions.includes(link.perm))

  if (links.length === 0) {
    return null
  }

  return (
    <section className="page-content admin-dashboard-section">
      <h2>Atalhos</h2>
      <ul className="admin-quick-links">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}