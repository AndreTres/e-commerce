import type { FinancingSimulation } from '../../types/financing'
import {
  formatCurrency,
  formatDateTime,
  formatMonthlyInterestRate,
} from '../../utils/format'

type FinancingSimulationDetailsProps = {
  simulation: FinancingSimulation
}

export function FinancingSimulationDetails({
  simulation,
}: FinancingSimulationDetailsProps) {
  const title = `${simulation.veiculo.marca} ${simulation.veiculo.modelo}`

  return (
    <dl className="detail-list financing-detail">
      <dt>Veículo</dt>
      <dd>{title} ({simulation.veiculo.ano})</dd>
      <dt>Preço do veículo</dt>
      <dd>{formatCurrency(simulation.valorVeiculo)}</dd>
      <dt>Entrada</dt>
      <dd>{formatCurrency(simulation.valorEntrada)}</dd>
      <dt>Valor financiado</dt>
      <dd>{formatCurrency(simulation.valorFinanciado)}</dd>
      <dt>Prazo</dt>
      <dd>{simulation.prazoMeses} meses</dd>
      <dt>Taxa de juros (mensal)</dt>
      <dd>{formatMonthlyInterestRate(simulation.taxaJuros)}</dd>
      <dt>Parcela estimada</dt>
      <dd className="financing-detail__installment">
        {formatCurrency(simulation.valorParcela)}
      </dd>
      <dt>Data da simulação</dt>
      <dd>{formatDateTime(simulation.dataSimulacao)}</dd>
    </dl>
  )
}