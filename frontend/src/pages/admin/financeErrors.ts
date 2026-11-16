import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Payment not found': 'Pagamento não encontrado.',
  'Sale not found': 'Venda não encontrada.',
  'Cancelled sales cannot receive new payments':
    'Vendas canceladas não podem receber novos pagamentos.',
  'Payment status transition is not allowed':
    'Esta alteração de status não é permitida para o pagamento atual.',
  'start_date must be less than or equal to end_date':
    'A data inicial deve ser anterior ou igual à data final.',
  'Insufficient permissions': 'Você não tem permissão para esta ação.',
}

export function translateFinanceError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 403) {
    return MESSAGES[err.detail] ?? 'Você não tem permissão para acessar o financeiro.'
  }
  if (err.status === 422) {
    return 'Revise os filtros: verifique se o ID da venda é um UUID válido.'
  }
  return MESSAGES[err.detail] ?? err.detail
}