import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type AccountLink = { to: string; label: string; end?: boolean }

const ACCOUNT_LINKS: AccountLink[] = [
  { to: '/account', label: 'Painel', end: true },
  { to: '/account/profile', label: 'Meu perfil' },
  { to: '/account/purchases', label: 'Minhas compras' },
  { to: '/account/test-drives', label: 'Test drives' },
  { to: '/account/financing', label: 'Financiamento' },
  { to: '/account/notifications', label: 'Notificações' },
]

export function AccountLayout() {
  const { logout } = useAuth()

  return (
    <div className="app-shell app-shell--account">
      <header className="site-header site-header--account">
        <Link to="/" className="brand">
          AutoCommerce
        </Link>
        <span className="header-badge">Área do cliente</span>
        <div className="header-actions">
          <Link to="/vehicles" className="btn-text">
            Catálogo
          </Link>
          <button type="button" className="btn-text" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <div className="account-body">
        <nav className="account-nav" aria-label="Conta do cliente">
          {ACCOUNT_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="site-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
