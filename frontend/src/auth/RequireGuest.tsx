import { Navigate, Outlet } from 'react-router-dom'
import { getDefaultHomePath } from './redirects'
import { useAuth } from './AuthContext'

export function RequireGuest() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="state-message" role="status">
        Carregando…
      </div>
    )
  }

  if (user) {
    return <Navigate to={getDefaultHomePath(user.role)} replace />
  }

  return <Outlet />
}
