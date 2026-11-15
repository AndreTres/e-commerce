import { Link } from 'react-router-dom'
import type { Vehicle } from '../../types/vehicle'
import { formatCurrency, formatMileage } from '../../utils/format'
import { VehicleStatusBadge } from './VehicleStatusBadge'

type VehicleCardProps = {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const title = `${vehicle.marca} ${vehicle.modelo}`

  return (
    <article className="vehicle-card">
      <div className="vehicle-card__visual" aria-hidden="true">
        <span className="vehicle-card__placeholder">{vehicle.marca.charAt(0)}</span>
      </div>
      <div className="vehicle-card__body">
        <header className="vehicle-card__header">
          <h2 className="vehicle-card__title">
            <Link to={`/vehicles/${vehicle.id}`}>{title}</Link>
          </h2>
          <VehicleStatusBadge status={vehicle.status} />
        </header>
        <ul className="vehicle-card__meta">
          <li>{vehicle.ano}</li>
          <li>{vehicle.cor}</li>
          <li>{formatMileage(vehicle.quilometragem)}</li>
        </ul>
        <p className="vehicle-card__price">{formatCurrency(vehicle.preco)}</p>
        <Link to={`/vehicles/${vehicle.id}`} className="vehicle-card__link">
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}
