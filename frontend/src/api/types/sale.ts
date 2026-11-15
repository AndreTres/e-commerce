import type { SaleStatus } from '../../types/sale'
import type { PaymentMethod } from '../../types/sale'

export type SaleClientSummaryBody = {
  id: string
  nome: string
  email: string
}

export type SaleVehicleSummaryBody = {
  id: string
  marca: string
  modelo: string
  ano: number
  status: string
  preco: string | number
}

export type SaleResponseBody = {
  id: string
  cliente_id: string
  veiculo_id: string
  data_venda: string
  valor_total: string | number
  status: SaleStatus
  forma_pagamento: PaymentMethod
  observacoes: string | null
  cliente: SaleClientSummaryBody
  veiculo: SaleVehicleSummaryBody
}
