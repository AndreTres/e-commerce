import type { PaymentMethod } from './sale'
import type { SaleStatus } from './sale'

export const PAYMENT_STATUSES = [
  'PENDENTE',
  'APROVADO',
  'RECUSADO',
  'CANCELADO',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
}

/** Espelha `ALLOWED_PAYMENT_TRANSITIONS` do backend (`app/core/payment_status.py`). */
export const ALLOWED_PAYMENT_TRANSITIONS: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  PENDENTE: ['APROVADO', 'RECUSADO', 'CANCELADO'],
  APROVADO: [],
  RECUSADO: [],
  CANCELADO: [],
}

export function getAllowedPaymentTransitions(from: PaymentStatus): PaymentStatus[] {
  return [...ALLOWED_PAYMENT_TRANSITIONS[from]]
}

export type Payment = {
  id: string
  vendaId: string
  tipo: PaymentMethod
  valor: string
  dataPagamento: string
  status: PaymentStatus
  observacoes: string | null
  venda: {
    id: string
    status: SaleStatus
    valorTotal: string
    clienteId: string
    veiculoId: string
  }
}