import type { FinancingSimulation } from '../types/financing'
import { apiRequest } from './httpClient'
import type { SimulationCreateBody, SimulationResponseBody } from './types/financing'

function mapSimulation(dto: SimulationResponseBody): FinancingSimulation {
  return {
    id: dto.id,
    clienteId: dto.cliente_id,
    veiculoId: dto.veiculo_id,
    valorVeiculo: String(dto.valor_veiculo),
    valorEntrada: String(dto.valor_entrada),
    valorFinanciado: String(dto.valor_financiado),
    prazoMeses: dto.prazo_meses,
    taxaJuros: String(dto.taxa_juros),
    valorParcela: String(dto.valor_parcela),
    dataSimulacao: dto.data_simulacao,
    veiculo: {
      id: dto.veiculo.id,
      marca: dto.veiculo.marca,
      modelo: dto.veiculo.modelo,
      ano: dto.veiculo.ano,
      preco: String(dto.veiculo.preco),
    },
  }
}

function buildListPath(veiculoId?: string): string {
  if (veiculoId) {
    return `/api/financing/simulations?veiculo_id=${veiculoId}`
  }
  return '/api/financing/simulations'
}

export async function listFinancingSimulations(
  token: string,
  veiculoId?: string,
): Promise<FinancingSimulation[]> {
  const data = await apiRequest<SimulationResponseBody[]>(buildListPath(veiculoId), {
    token,
  })
  return data.map(mapSimulation)
}

export async function createFinancingSimulation(
  payload: SimulationCreateBody,
  token: string,
): Promise<FinancingSimulation> {
  const data = await apiRequest<SimulationResponseBody>('/api/financing/simulations', {
    method: 'POST',
    body: payload,
    token,
  })
  return mapSimulation(data)
}

export async function getFinancingSimulation(
  simulationId: string,
  token: string,
): Promise<FinancingSimulation> {
  const data = await apiRequest<SimulationResponseBody>(
    `/api/financing/simulations/${simulationId}`,
    { token },
  )
  return mapSimulation(data)
}