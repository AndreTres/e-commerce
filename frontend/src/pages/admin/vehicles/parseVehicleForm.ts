import type { VehicleWriteBody } from '../../../api/types/vehicle'

export type VehicleFormValues = {
  marca: string
  modelo: string
  ano: string
  cor: string
  quilometragem: string
  preco: string
  descricao: string
}

export function parseVehicleForm(values: VehicleFormValues): VehicleWriteBody {
  const ano = Number.parseInt(values.ano, 10)
  const quilometragem = Number.parseInt(values.quilometragem, 10)
  const preco = Number(values.preco.replace(',', '.'))

  if (
    !values.marca.trim() ||
    !values.modelo.trim() ||
    !values.cor.trim() ||
    Number.isNaN(ano) ||
    Number.isNaN(quilometragem) ||
    Number.isNaN(preco) ||
    preco <= 0 ||
    quilometragem < 0
  ) {
    throw new Error('Revise os campos obrigatórios e valores numéricos.')
  }

  return {
    marca: values.marca.trim(),
    modelo: values.modelo.trim(),
    ano,
    cor: values.cor.trim(),
    quilometragem,
    preco,
    descricao: values.descricao.trim(),
  }
}