import type { Vehicle, VehicleListFilters } from '../types/vehicle'
import { apiRequest } from './httpClient'
import type {
  VehicleResponseBody,
  VehicleStatusUpdateBody,
  VehicleWriteBody,
} from './types/vehicle'

function mapVehicle(dto: VehicleResponseBody): Vehicle {
  return {
    id: dto.id,
    marca: dto.marca,
    modelo: dto.modelo,
    ano: dto.ano,
    cor: dto.cor,
    quilometragem: dto.quilometragem,
    preco: String(dto.preco),
    status: dto.status,
    descricao: dto.descricao,
  }
}

function buildListQuery(filters: VehicleListFilters): string {
  const params = new URLSearchParams()
  const marca = filters.marca?.trim()
  const modelo = filters.modelo?.trim()
  const cor = filters.cor?.trim()
  const precoMin = filters.preco_min?.trim()
  const precoMax = filters.preco_max?.trim()

  if (marca) {
    params.set('marca', marca)
  }
  if (modelo) {
    params.set('modelo', modelo)
  }
  if (filters.ano !== undefined && !Number.isNaN(filters.ano)) {
    params.set('ano', String(filters.ano))
  }
  if (cor) {
    params.set('cor', cor)
  }
  if (precoMin) {
    params.set('preco_min', precoMin)
  }
  if (precoMax) {
    params.set('preco_max', precoMax)
  }

  const query = params.toString()
  return query ? `/api/vehicles?${query}` : '/api/vehicles'
}

export async function listVehicles(
  filters: VehicleListFilters = {},
): Promise<Vehicle[]> {
  const data = await apiRequest<VehicleResponseBody[]>(buildListQuery(filters), {
    handleSessionExpired: false,
  })
  return data.map(mapVehicle)
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
  const data = await apiRequest<VehicleResponseBody>(`/api/vehicles/${vehicleId}`, {
    handleSessionExpired: false,
  })
  return mapVehicle(data)
}

export async function createVehicle(
  payload: VehicleWriteBody,
  token: string,
): Promise<Vehicle> {
  const body = { ...payload, descricao: payload.descricao ?? '' }
  const data = await apiRequest<VehicleResponseBody>('/api/vehicles', {
    method: 'POST',
    body,
    token,
  })
  return mapVehicle(data)
}

export async function updateVehicle(
  vehicleId: string,
  payload: VehicleWriteBody,
  token: string,
): Promise<Vehicle> {
  const body = { ...payload, descricao: payload.descricao ?? '' }
  const data = await apiRequest<VehicleResponseBody>(`/api/vehicles/${vehicleId}`, {
    method: 'PUT',
    body,
    token,
  })
  return mapVehicle(data)
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleStatusUpdateBody['status'],
  token: string,
): Promise<Vehicle> {
  const body: VehicleStatusUpdateBody = { status }
  const data = await apiRequest<VehicleResponseBody>(
    `/api/vehicles/${vehicleId}/status`,
    {
      method: 'PATCH',
      body,
      token,
    },
  )
  return mapVehicle(data)
}
