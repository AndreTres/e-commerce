import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Vehicle not found': 'Veículo não encontrado.',
  'Status change is not allowed for the current vehicle state':
    'Alteração de status não permitida para o estado atual do veículo.',
}

export function translateVehicleError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  return MESSAGES[err.detail] ?? err.detail
}