import { apiRequest } from './httpClient'
import type {
  CurrentUserResponseBody,
  LoginRequestBody,
  TokenResponseBody,
} from './types/auth'

export function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponseBody> {
  const body: LoginRequestBody = { email, password }
  return apiRequest<TokenResponseBody>('/api/auth/login', {
    method: 'POST',
    body,
    handleSessionExpired: false,
  })
}

export function fetchCurrentUser(token: string): Promise<CurrentUserResponseBody> {
  return apiRequest<CurrentUserResponseBody>('/api/auth/me', {
    token,
    handleSessionExpired: true,
  })
}
