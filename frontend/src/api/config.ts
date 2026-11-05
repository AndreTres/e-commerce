const rawBase = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Base URL without trailing slash; empty string uses same origin (Vite proxy). */
export function getApiBaseUrl(): string {
  if (!rawBase || rawBase.trim() === '') {
    return ''
  }
  return rawBase.replace(/\/+$/, '')
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
