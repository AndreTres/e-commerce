export type SimulationResponseBody = {
  id: string
  cliente_id: string
  veiculo_id: string
  valor_veiculo: string | number
  valor_entrada: string | number
  valor_financiado: string | number
  prazo_meses: number
  taxa_juros: string | number
  valor_parcela: string | number
  data_simulacao: string
  veiculo: {
    id: string
    marca: string
    modelo: string
    ano: number
    preco: string | number
  }
}

export type SimulationCreateBody = {
  veiculo_id: string
  valor_entrada: string | number
  prazo_meses: number
}