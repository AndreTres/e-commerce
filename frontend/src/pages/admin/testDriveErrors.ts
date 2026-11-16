import { ApiError } from '../../api/errors'
import { translateTestDriveError as translateAccountTestDriveError } from '../account/testDriveErrors'

const EXTRA_MESSAGES: Record<string, string> = {
  'Test drive appointment not found': 'Agendamento de test drive não encontrado.',
  'Client not found': 'Cliente não encontrado.',
  'Vehicle not found': 'Veículo não encontrado.',
}

export function translateAdminTestDriveError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 422) {
    return 'Revise os filtros: verifique se o ID do veículo é um UUID válido e a data no formato AAAA-MM-DD.'
  }
  if (EXTRA_MESSAGES[err.detail]) {
    return EXTRA_MESSAGES[err.detail]
  }
  return translateAccountTestDriveError(err, fallback)
}