export const VEHICLE_STATUSES = [
  'DISPONIVEL',
  'RESERVADO',
  'VENDIDO',
  'INDISPONIVEL',
] as const

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export type Vehicle = {
  id: string
  marca: string
  modelo: string
  ano: number
  cor: string
  quilometragem: number
  preco: string
  status: VehicleStatus
  descricao: string
}

export type VehicleListFilters = {
  marca?: string
  modelo?: string
  ano?: number
  cor?: string
  preco_min?: string
  preco_max?: string
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
  INDISPONIVEL: 'Indisponível',
}
