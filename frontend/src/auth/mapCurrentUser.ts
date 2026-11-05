import type { CurrentUserResponseBody } from '../api/types/auth'
import type { AuthUser, UserRole } from '../types/user'
import { USER_ROLES } from '../types/user'

export function mapCurrentUser(dto: CurrentUserResponseBody): AuthUser {
  if (!USER_ROLES.includes(dto.role as UserRole)) {
    throw new Error('Perfil de usuário não reconhecido.')
  }
  return {
    id: dto.id,
    email: dto.email,
    role: dto.role as UserRole,
  }
}
