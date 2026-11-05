export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function getErrorMessageFromBody(body: unknown): string {
  if (body === null || body === undefined) {
    return 'Ocorreu um erro inesperado.'
  }
  if (typeof body === 'string') {
    return body
  }
  if (typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string }
      if (typeof first?.msg === 'string') {
        return first.msg
      }
    }
  }
  return 'Ocorreu um erro inesperado.'
}
