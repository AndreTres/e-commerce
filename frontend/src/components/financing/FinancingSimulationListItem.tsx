import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FinancingSimulation } from '../../types/financing'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { FinancingSimulationDetails } from './FinancingSimulationDetails'

type FinancingSimulationListItemProps = {
  simulation: FinancingSimulation
  loadingDetail?: boolean
  onExpand?: (id: string) => Promise<void>
}

export function FinancingSimulationListItem({
  simulation,
  loadingDetail,
  onExpand,
}: FinancingSimulationListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const title = `${simulation.veiculo.marca} ${simulation.veiculo.modelo}`

  async function toggle() {
    const next = !expanded
    setExpanded(next)
    if (next && onExpand) {
      await onExpand(simulation.id)
    }
  }

  return (
    <article className="financing-item">
      <button
        type="button"
        className="financing-item__summary"
        onClick={() => void toggle()}
        aria-expanded={expanded}
      >
        <span className="financing-item__title">{title}</span>
        <span className="text-muted financing-item__meta">
          {simulation.prazoMeses} meses · {formatCurrency(simulation.valorParcela)}/mês
        </span>
        <span className="text-muted financing-item__meta">
          {formatDateTime(simulation.dataSimulacao)}
        </span>
      </button>
      <p className="financing-item__link">
        <Link to={`/vehicles/${simulation.veiculo.id}`}>Ver veículo</Link>
      </p>
      {expanded ? (
        <div className="financing-item__detail">
          {loadingDetail ? (
            <p className="text-muted">Atualizando detalhes…</p>
          ) : (
            <FinancingSimulationDetails simulation={simulation} />
          )}
        </div>
      ) : null}
    </article>
  )
}