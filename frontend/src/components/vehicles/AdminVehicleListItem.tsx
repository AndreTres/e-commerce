import { Link } from 'react-router-dom'
import type { Vehicle } from '../../types/vehicle'
import { formatCurrency, formatMileage } from '../../utils/format'
import { VehicleStatusBadge } from './VehicleStatusBadge'

type AdminVehicleListItemProps = {
  vehicle: Vehicle
}

export function AdminVehicleListItem({ vehicle }: AdminVehicleListItemProps) {
  const title = `${vehicle.marca} ${vehicle.modelo}`

  return (
    <article className="admin-vehicle-item">
      <div className="admin-vehicle-item__main">
        <h2 className="admin-vehicle-item__title">
          <Link to={`/admin/vehicles/${vehicle.id}`}>{title}</Link>
        </h2>
        <p className="text-muted">
          {vehicle.ano} · {vehicle.cor} · {formatMileage(vehicle.quilometragem)}
        </p>
      </div>
      <div className="admin-vehicle-item__aside">
        <VehicleStatusBadge status={vehicle.status} />
        <p className="admin-vehicle-item__price">{formatCurrency(vehicle.preco)}</p>
      </div>
    </article>
  )
}