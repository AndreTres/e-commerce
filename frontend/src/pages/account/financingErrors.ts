import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Authenticated client account is not linked to a customer record':
    'Sua conta não está vinculada a um cadastro de cliente.',
  'Down payment must be lower than the vehicle price':
    'A entrada deve ser menor que o preço do veículo.',
  'Vehicle price must be positive': 'O preço do veículo é inválido.',
  'Vehicle not found': 'Veículo não encontrado.',
  'Financing simulation not found': 'Simulação não encontrada.',
  'Access to this financing simulation is not allowed':
    'Você não tem acesso a esta simulação.',
}

export function translateFinancingError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  return MESSAGES[err.detail] ?? err.detail
}