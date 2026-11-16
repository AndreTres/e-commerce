import type { Payment, PaymentStatus } from '../types/payment'
import type { SaleStatus } from '../types/sale'
import { apiRequest } from './httpClient'
import type { FinanceSummaryBody, PaymentResponseBody } from './types/finance'

type DateRangeParams = {
  startDate?: string
  endDate?: string
}

function appendDateRange(path: string, range?: DateRangeParams): string {
  if (!range?.startDate && !range?.endDate) {
    return path
  }
  const params = new URLSearchParams()
  if (range.startDate) {
    params.set('start_date', range.startDate)
  }
  if (range.endDate) {
    params.set('end_date', range.endDate)
  }
  return `${path}?${params.toString()}`
}

function mapPayment(dto: PaymentResponseBody): Payment {
  return {
    id: dto.id,
    vendaId: dto.venda_id,
    tipo: dto.tipo,
    valor: String(dto.valor),
    dataPagamento: dto.data_pagamento,
    status: dto.status,
    observacoes: dto.observacoes,
    venda: {
      id: dto.venda.id,
      status: dto.venda.status as SaleStatus,
      valorTotal: String(dto.venda.valor_total),
      clienteId: dto.venda.cliente_id,
      veiculoId: dto.venda.veiculo_id,
    },
  }
}

export function getFinanceSummary(
  token: string,
  range?: DateRangeParams,
): Promise<FinanceSummaryBody> {
  return apiRequest<FinanceSummaryBody>(appendDateRange('/api/finance/summary', range), {
    token,
  })
}

export type ListPaymentsOptions = {
  status?: PaymentStatus
  vendaId?: string
}

function buildPaymentsPath(options: ListPaymentsOptions = {}): string {
  const params = new URLSearchParams()
  if (options.status) {
    params.set('status', options.status)
  }
  if (options.vendaId) {
    params.set('venda_id', options.vendaId)
  }
  const query = params.toString()
  return query ? `/api/finance/payments?${query}` : '/api/finance/payments'
}

export async function listPayments(
  token: string,
  options: ListPaymentsOptions = {},
): Promise<Payment[]> {
  const data = await apiRequest<PaymentResponseBody[]>(buildPaymentsPath(options), { token })
  return data.map(mapPayment)
}

export async function getPayment(paymentId: string, token: string): Promise<Payment> {
  const data = await apiRequest<PaymentResponseBody>(`/api/finance/payments/${paymentId}`, {
    token,
  })
  return mapPayment(data)
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  token: string,
): Promise<Payment> {
  const data = await apiRequest<PaymentResponseBody>(
    `/api/finance/payments/${paymentId}/status`,
    {
      method: 'PATCH',
      body: { status },
      token,
    },
  )
  return mapPayment(data)
}