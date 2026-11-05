import { getRequiredPermissionForAdminPath, hasAdminPermission } from '../config/adminPermissions'
import type { UserRole } from '../types/user'
import { isEmployeeRole } from '../types/user'

export function getDefaultHomePath(role: UserRole): string {
  if (role === 'CLIENT') {
    return '/account'
  }
  if (isEmployeeRole(role)) {
    return '/admin'
  }
  return '/'
}

function isPublicPath(path: string): boolean {
  if (path === '/login') {
    return false
  }
  return (
    path === '/' ||
    path.startsWith('/vehicles') ||
    path === '/access-denied'
  )
}

function canAccessPath(role: UserRole, path: string): boolean {
  if (isPublicPath(path)) {
    return true
  }
  if (path.startsWith('/account')) {
    return role === 'CLIENT'
  }
  if (path.startsWith('/admin')) {
    if (!isEmployeeRole(role)) {
      return false
    }
    const permission = getRequiredPermissionForAdminPath(path)
    return hasAdminPermission(role, permission)
  }
  return false
}

/** Resolves post-login redirect from optional `from` location state. */
export function resolvePostLoginPath(role: UserRole, from?: string | null): string {
  if (from && from.startsWith('/') && canAccessPath(role, from)) {
    return from
  }
  return getDefaultHomePath(role)
}
