import { Link, NavLink, Outlet } from 'react-router-dom'
import { getAdminNavForRole } from '../config/adminPermissions'
import { useAuth } from '../auth/AuthContext'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navItems = user ? getAdminNavForRole(user.role) : []

  return (
    <div className="app-shell app-shell--admin">
      <aside className="admin-sidebar" aria-label="Administração">
        <Link to="/admin" className="brand brand--sidebar">
          AutoCommerce
        </Link>
        <p className="sidebar-label">Administração</p>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <span className="text-muted">
            {user?.email ?? ''}
            {user?.role ? ` · ${user.role}` : ''}
          </span>
          <div className="header-actions">
            <Link to="/" className="btn-text">
              Site público
            </Link>
            <button type="button" className="btn-text" onClick={logout}>
              Sair
            </button>
          </div>
        </header>
        <main className="site-main site-main--admin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
