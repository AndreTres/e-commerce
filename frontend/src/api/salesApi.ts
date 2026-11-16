import type { Sale, SaleStatus } from '../types/sale'
import { apiRequest } from './httpClient'
import type { SaleResponseBody } from './types/sale'

function mapSale(dto: SaleResponseBody): Sale {
  return {
    id: dto.id,
    clienteId: dto.cliente_id,
    veiculoId: dto.veiculo_id,
    dataVenda: dto.data_venda,
    valorTotal: String(dto.valor_total),
    status: dto.status,
    formaPagamento: dto.forma_pagamento,
    observacoes: dto.observacoes,
    cliente: {
      id: dto.cliente.id,
      nome: dto.cliente.nome,
      email: dto.cliente.email,
    },
    veiculo: {
      id: dto.veiculo.id,
      marca: dto.veiculo.marca,
      modelo: dto.veiculo.modelo,
      ano: dto.veiculo.ano,
      status: dto.veiculo.status,
      preco: String(dto.veiculo.preco),
    },
  }
}

export type ListSalesOptions = {
  status?: SaleStatus
  clienteId?: string
  veiculoId?: string
}

function buildSalesListPath(options: ListSalesOptions): string {
  const params = new URLSearchParams()
  if (options.status) {
    params.set('status', options.status)
  }
  if (options.clienteId?.trim()) {
    params.set('cliente_id', options.clienteId.trim())
  }
  if (options.veiculoId?.trim()) {
    params.set('veiculo_id', options.veiculoId.trim())
  }
  const query = params.toString()
  return query ? `/api/sales?${query}` : '/api/sales'
}

export async function listSales(
  token: string,
  options: ListSalesOptions = {},
): Promise<Sale[]> {
  const data = await apiRequest<SaleResponseBody[]>(buildSalesListPath(options), {
    token,
  })
  return data.map(mapSale)
}

export async function getSale(saleId: string, token: string): Promise<Sale> {
  const data = await apiRequest<SaleResponseBody>(`/api/sales/${saleId}`, {
    token,
  })
  return mapSale(data)
}

export async function updateSaleStatus(
  saleId: string,
  status: SaleStatus,
  token: string,
): Promise<Sale> {
  const data = await apiRequest<SaleResponseBody>(`/api/sales/${saleId}/status`, {
    method: 'PATCH',
    body: { status },
    token,
  })
  return mapSale(data)
}
