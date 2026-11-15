export type FinancingSimulation = {
  id: string
  clienteId: string
  veiculoId: string
  valorVeiculo: string
  valorEntrada: string
  valorFinanciado: string
  prazoMeses: number
  taxaJuros: string
  valorParcela: string
  dataSimulacao: string
  veiculo: {
    id: string
    marca: string
    modelo: string
    ano: number
    preco: string
  }
}