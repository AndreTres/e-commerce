import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { getClient } from '../../api/clientsApi'
import { listSales } from '../../api/salesApi'
import { useAuth } from '../../auth/AuthContext'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { SaleListItem } from '../../components/sales/SaleListItem'
import type { ClientProfile } from '../../types/client'
import type { Sale } from '../../types/sale'

const SHORTCUTS = [
  { to: '/account/profile', label: 'Meu perfil', description: 'Dados pessoais e contato' },
  { to: '/account/purchases', label: 'Minhas compras', description: 'Histórico de vendas' },
  { to: '/account/test-drives', label: 'Test drives', description: 'Agendamentos' },
  { to: '/account/financing', label: 'Financiamento', description: 'Simulações' },
  { to: '/account/notifications', label: 'Notificações', description: 'Em breve' },
  { to: '/vehicles', label: 'Catálogo', description: 'Veículos disponíveis' },
] as const

export function AccountDashboardPage() {
  const { user, clienteId, getAccessToken } = useAuth()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const salesData = await listSales(token)
      setSales(salesData)

      if (clienteId) {
        try {
          const clientData = await getClient(clienteId, token)
          setProfile(clientData)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : 'Não foi possível carregar o painel.'
      setError(message)
      setSales([])
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [clienteId, getAccessToken])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const recentSales = sales.slice(0, 3)

  return (
    <div className="account-stack">
      <header className="account-page-header">
        <h1>Minha conta</h1>
        <p className="text-muted">
          Olá{profile ? `, ${profile.nome}` : user?.email ? `, ${user.email}` : ''}. Acompanhe
          compras e acesse os atalhos abaixo.
        </p>
      </header>

      {loading ? <LoadingMessage label="Carregando painel…" /> : null}

      {!loading && error ? (
        <ErrorMessage message={error} onRetry={() => void loadDashboard()} />
      ) : null}

      {!loading && !error ? (
        <>
          <section className="account-shortcuts" aria-label="Atalhos">
            {SHORTCUTS.map((item) => (
              <Link key={item.to} to={item.to} className="account-shortcut">
                <span className="account-shortcut__label">{item.label}</span>
                <span className="account-shortcut__desc">{item.description}</span>
              </Link>
            ))}
          </section>

          <section className="page-content" aria-labelledby="recent-purchases-title">
            <h2 id="recent-purchases-title">Compras recentes</h2>
            {recentSales.length === 0 ? (
              <EmptyMessage
                title="Nenhuma compra registrada"
                message="Quando você solicitar a compra de um veículo, ela aparecerá aqui."
                action={
                  <Link to="/vehicles" className="btn-secondary btn-secondary--inline">
                    Ver catálogo
                  </Link>
                }
              />
            ) : (
              <div className="sale-list">
                {recentSales.map((sale) => (
                  <SaleListItem key={sale.id} sale={sale} />
                ))}
              </div>
            )}
            {sales.length > 0 ? (
              <p className="account-more-link">
                <Link to="/account/purchases">Ver todas as compras ({sales.length})</Link>
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  )
}
