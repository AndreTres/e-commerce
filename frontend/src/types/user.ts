export const USER_ROLES = [
  'CLIENT',
  'SELLER',
  'MANAGER',
  'FINANCE',
  'ADMIN',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  clienteId?: string | null
  colaboradorId?: string | null
}

export const EMPLOYEE_ROLES: UserRole[] = [
  'SELLER',
  'MANAGER',
  'FINANCE',
  'ADMIN',
]

export function isEmployeeRole(role: UserRole): boolean {
  return EMPLOYEE_ROLES.includes(role)
}
