import type { VehicleStatus } from '../../types/vehicle'

export type VehicleResponseBody = {
  id: string
  marca: string
  modelo: string
  ano: number
  cor: string
  quilometragem: number
  preco: string | number
  status: VehicleStatus
  descricao: string
}
