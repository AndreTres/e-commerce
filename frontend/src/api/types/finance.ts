import type { PaymentStatus } from '../../types/payment'
import type { PaymentMethod } from '../../types/sale'

export type { PaymentStatus }

export type FinanceSummaryBody = {
  total_payments: number
  approved_payments_value: string | number
  pending_payments_value: string | number
  rejected_payments_value: string | number
  cancelled_payments_value: string | number
}

export type PaymentResponseBody = {
  id: string
  venda_id: string
  tipo: PaymentMethod
  valor: string | number
  data_pagamento: string
  status: PaymentStatus
  observacoes: string | null
  venda: {
    id: string
    status: string
    valor_total: string | number
    cliente_id: string
    veiculo_id: string
  }
}