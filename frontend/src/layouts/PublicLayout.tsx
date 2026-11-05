import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function PublicLayout() {
  const { user, logout } = useAuth()
  const isClient = user?.role === 'CLIENT'

  return (
    <div className="app-shell app-shell--public">
      <header className="site-header">
        <Link to="/" className="brand">
          AutoCommerce
        </Link>
        <nav className="site-nav" aria-label="Navegação principal">
          <NavLink to="/" end>
            Início
          </NavLink>
          <NavLink to="/vehicles">Catálogo</NavLink>
          {isClient ? (
            <NavLink to="/account">Minha conta</NavLink>
          ) : (
            <NavLink to="/login">Entrar</NavLink>
          )}
        </nav>
        {isClient ? (
          <button type="button" className="btn-text" onClick={logout}>
            Sair
          </button>
        ) : null}
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
