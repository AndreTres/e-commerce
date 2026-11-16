import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Sale not found': 'Venda não encontrada.',
  'Access to this sale is not allowed':
    'Você não tem permissão para acessar esta venda.',
  'Sale status transition is not allowed':
    'Esta alteração de status não é permitida para o estado atual da venda.',
  'Vehicle is not available for sale':
    'O veículo não está disponível para esta operação.',
  'Vehicle has already been sold': 'O veículo já foi vendido.',
  'Vehicle not found': 'Veículo não encontrado.',
  'Client not found': 'Cliente não encontrado.',
  'cliente_id is required for this operation':
    'É necessário informar o cliente ao registrar a venda.',
}

export function translateSaleError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 422) {
    return 'Revise os filtros: verifique se os IDs de cliente e veículo são UUIDs válidos.'
  }
  return MESSAGES[err.detail] ?? err.detail
}