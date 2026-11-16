import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'start_date must be less than or equal to end_date':
    'A data inicial deve ser anterior ou igual à data final.',
  'Insufficient permissions': 'Você não tem permissão para acessar os relatórios.',
}

export function translateReportError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 403) {
    return MESSAGES[err.detail] ?? 'Acesso restrito a gestores e administradores.'
  }
  return MESSAGES[err.detail] ?? err.detail
}