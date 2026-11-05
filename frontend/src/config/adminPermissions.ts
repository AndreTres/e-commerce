import type { UserRole } from '../types/user'

export type AdminPermission =
  | 'dashboard'
  | 'vehicles'
  | 'clients'
  | 'sales'
  | 'test_drives'
  | 'finance'
  | 'notifications'
  | 'reports'

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  CLIENT: [],
  SELLER: ['dashboard', 'vehicles', 'clients', 'sales', 'test_drives'],
  MANAGER: [
    'dashboard',
    'vehicles',
    'clients',
    'sales',
    'test_drives',
    'reports',
  ],
  FINANCE: ['dashboard', 'finance'],
  ADMIN: [
    'dashboard',
    'vehicles',
    'clients',
    'sales',
    'test_drives',
    'finance',
    'notifications',
    'reports',
  ],
}

export type AdminNavItem = {
  path: string
  label: string
  permission: AdminPermission
  end?: boolean
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { path: '/admin', label: 'Painel', permission: 'dashboard', end: true },
  { path: '/admin/vehicles', label: 'Veículos', permission: 'vehicles' },
  { path: '/admin/clients', label: 'Clientes', permission: 'clients' },
  { path: '/admin/sales', label: 'Vendas', permission: 'sales' },
  { path: '/admin/test-drives', label: 'Test drives', permission: 'test_drives' },
  { path: '/admin/finance', label: 'Financeiro', permission: 'finance' },
  { path: '/admin/notifications', label: 'Notificações', permission: 'notifications' },
  { path: '/admin/reports', label: 'Relatórios', permission: 'reports' },
]

export function getAdminPermissions(role: UserRole): AdminPermission[] {
  return ROLE_PERMISSIONS[role]
}

export function hasAdminPermission(
  role: UserRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function getAdminNavForRole(role: UserRole): AdminNavItem[] {
  const allowed = getAdminPermissions(role)
  return ADMIN_NAV_ITEMS.filter((item) => allowed.includes(item.permission))
}

/** Maps admin URL prefixes to required permission (most specific first). */
const ADMIN_ROUTE_PERMISSIONS: { prefix: string; permission: AdminPermission }[] =
  [
    { prefix: '/admin/vehicles', permission: 'vehicles' },
    { prefix: '/admin/clients', permission: 'clients' },
    { prefix: '/admin/sales', permission: 'sales' },
    { prefix: '/admin/test-drives', permission: 'test_drives' },
    { prefix: '/admin/finance', permission: 'finance' },
    { prefix: '/admin/notifications', permission: 'notifications' },
    { prefix: '/admin/reports', permission: 'reports' },
    { prefix: '/admin', permission: 'dashboard' },
  ]

export function getRequiredPermissionForAdminPath(
  pathname: string,
): AdminPermission {
  const match = ADMIN_ROUTE_PERMISSIONS.find((entry) =>
    pathname.startsWith(entry.prefix),
  )
  return match?.permission ?? 'dashboard'
}
