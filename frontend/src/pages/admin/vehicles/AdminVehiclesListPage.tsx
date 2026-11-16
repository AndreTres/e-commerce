import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import { listVehicles } from '../../../api/vehiclesApi'
import { AdminVehicleListItem } from '../../../components/vehicles/AdminVehicleListItem'
import { VehicleFilters } from '../../../components/vehicles/VehicleFilters'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { Vehicle, VehicleListFilters } from '../../../types/vehicle'
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
} from '../../public/vehicleFiltersFromSearchParams'
import { translateVehicleError } from '../vehicleErrors'

export function AdminVehiclesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const filters = filtersFromSearchParams(searchParams)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVehicles = useCallback(async (activeFilters: VehicleListFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVehicles(activeFilters)
      setVehicles(data)
    } catch (err) {
      let message = 'Não foi possível carregar os veículos.'
      if (err instanceof ApiError && err.status === 422) {
        message =
          'Revise os filtros de preço: o valor mínimo deve ser menor ou igual ao máximo.'
      } else {
        message = translateVehicleError(err, message)
      }
      setError(message)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const active = filtersFromSearchParams(searchParams)
    void loadVehicles(active)
  }, [filterKey, loadVehicles, searchParams])

  function applyFilters(next: VehicleListFilters) {
    setSearchParams(searchParamsFromFilters(next), { replace: true })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="account-stack">
      <header className="account-page-header admin-section-heading">
        <div>
          <h1>Gestão de veículos</h1>
          <p className="text-muted">
            A API de listagem retorna veículos com status{' '}
            <strong>disponível</strong> (mesmo comportamento do catálogo público).
            Veículos em outros status permanecem acessíveis pelo ID quando conhecido.
          </p>
        </div>
        <Link to="/admin/vehicles/new" className="btn-primary btn-primary--inline">
          Cadastrar veículo
        </Link>
      </header>

      <VehicleFilters
        key={filterKey}
        initial={filters}
        onApply={applyFilters}
        onClear={clearFilters}
        disabled={loading}
      />

      {loading ? <LoadingMessage label="Carregando veículos…" /> : null}

      {!loading && error ? (
        <ErrorMessage
          message={error}
          onRetry={() => void loadVehicles(filtersFromSearchParams(searchParams))}
        />
      ) : null}

      {!loading && !error && vehicles.length === 0 ? (
        <EmptyMessage
          title="Nenhum veículo encontrado"
          message="Ajuste os filtros ou cadastre um novo veículo."
          action={
            <Link to="/admin/vehicles/new" className="btn-secondary btn-secondary--inline">
              Cadastrar veículo
            </Link>
          }
        />
      ) : null}

      {!loading && !error && vehicles.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {vehicles.length} veículo{vehicles.length === 1 ? '' : 's'} na listagem
          </p>
          <div className="admin-vehicle-list">
            {vehicles.map((vehicle) => (
              <AdminVehicleListItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}