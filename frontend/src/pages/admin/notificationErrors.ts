import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Notification not found': 'Notificação não encontrada.',
  'Access to this notification is not allowed':
    'Você não tem permissão para acessar esta notificação.',
  'Notification status transition is not allowed':
    'Esta alteração de status não é permitida para a notificação atual.',
  'Client not found': 'Cliente não encontrado.',
  'Insufficient permissions': 'Você não tem permissão para esta ação.',
}

export function translateNotificationError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 403) {
    return MESSAGES[err.detail] ?? 'Apenas administradores podem gerenciar notificações.'
  }
  return MESSAGES[err.detail] ?? err.detail
}