export const NOTIFICATION_TYPES = [
  'VENDA',
  'PAGAMENTO',
  'TEST_DRIVE',
  'FINANCIAMENTO',
  'GERAL',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  VENDA: 'Venda',
  PAGAMENTO: 'Pagamento',
  TEST_DRIVE: 'Test drive',
  FINANCIAMENTO: 'Financiamento',
  GERAL: 'Geral',
}

export const NOTIFICATION_STATUSES = ['PENDENTE', 'ENVIADA', 'FALHOU'] as const

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDENTE: 'Pendente',
  ENVIADA: 'Enviada',
  FALHOU: 'Falhou',
}

/** Espelha `ALLOWED_NOTIFICATION_TRANSITIONS` do backend. */
export const ALLOWED_NOTIFICATION_TRANSITIONS: Record<
  NotificationStatus,
  readonly NotificationStatus[]
> = {
  PENDENTE: ['ENVIADA', 'FALHOU'],
  ENVIADA: [],
  FALHOU: [],
}

export function getAllowedNotificationTransitions(
  from: NotificationStatus,
): NotificationStatus[] {
  return [...ALLOWED_NOTIFICATION_TRANSITIONS[from]]
}

export type Notification = {
  id: string
  clienteId: string
  tipo: NotificationType
  mensagem: string
  dataEnvio: string
  status: NotificationStatus
}