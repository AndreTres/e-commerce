import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, loginRequest } from '../api/authApi'
import { setSessionExpiredHandler } from '../api/httpClient'
import type { AuthUser } from '../types/user'
import { mapCurrentUser } from './mapCurrentUser'
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from './tokenStorage'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    clearStoredToken()
    setUser(null)
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearSession()
    })
    return () => setSessionExpiredHandler(null)
  }, [clearSession])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = getStoredToken()
      if (!token) {
        if (!cancelled) {
          setIsLoading(false)
        }
        return
      }

      try {
        const dto = await fetchCurrentUser(token)
        if (!cancelled) {
          setUser(mapCurrentUser(dto))
        }
      } catch {
        clearStoredToken()
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await loginRequest(email, password)
    setStoredToken(tokenResponse.access_token)
    const dto = await fetchCurrentUser(tokenResponse.access_token)
    const authenticated = mapCurrentUser(dto)
    setUser(authenticated)
    return authenticated
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const getAccessToken = useCallback(() => getStoredToken(), [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      getAccessToken,
    }),
    [user, isLoading, login, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return ctx
}
