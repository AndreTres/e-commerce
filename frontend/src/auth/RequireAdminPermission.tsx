import { useLocation } from 'react-router-dom'
import {
  getRequiredPermissionForAdminPath,
  hasAdminPermission,
} from '../config/adminPermissions'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'
import { useAuth } from './AuthContext'

type RequireAdminPermissionProps = {
  children: React.ReactNode
}

export function RequireAdminPermission({ children }: RequireAdminPermissionProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return null
  }

  const permission = getRequiredPermissionForAdminPath(location.pathname)
  if (!hasAdminPermission(user.role, permission)) {
    return <AccessDeniedPage />
  }

  return children
}
