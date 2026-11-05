import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'
import { useAuth } from './AuthContext'
import type { UserRole } from '../types/user'

type RequireAuthProps = {
  allowedRoles: UserRole[]
}

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="state-message" role="status">
        Carregando…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />
  }

  return <Outlet />
}
