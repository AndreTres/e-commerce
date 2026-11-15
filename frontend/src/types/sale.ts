export const SALE_STATUSES = [
  'PENDENTE',
  'EM_PROCESSAMENTO',
  'CONCLUIDA',
  'CANCELADA',
] as const

export type SaleStatus = (typeof SALE_STATUSES)[number]

export const PAYMENT_METHODS = [
  'DINHEIRO',
  'PIX',
  'CARTAO',
  'TRANSFERENCIA',
  'FINANCIAMENTO',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDENTE: 'Pendente',
  EM_PROCESSAMENTO: 'Em processamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO: 'Cartão',
  TRANSFERENCIA: 'Transferência',
  FINANCIAMENTO: 'Financiamento',
}

export type Sale = {
  id: string
  clienteId: string
  veiculoId: string
  dataVenda: string
  valorTotal: string
  status: SaleStatus
  formaPagamento: PaymentMethod
  observacoes: string | null
  cliente: {
    id: string
    nome: string
    email: string
  }
  veiculo: {
    id: string
    marca: string
    modelo: string
    ano: number
    status: string
    preco: string
  }
}
