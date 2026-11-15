import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { listVehicles } from '../../api/vehiclesApi'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { VehicleCard } from '../../components/vehicles/VehicleCard'
import { VehicleFilters } from '../../components/vehicles/VehicleFilters'
import type { Vehicle, VehicleListFilters } from '../../types/vehicle'
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
} from './vehicleFiltersFromSearchParams'

export function VehicleCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKey = searchParams.toString()
  const filters = filtersFromSearchParams(searchParams)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCatalog = useCallback(async (activeFilters: VehicleListFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVehicles(activeFilters)
      setVehicles(data)
    } catch (err) {
      let message = 'Não foi possível carregar o catálogo.'
      if (err instanceof ApiError) {
        if (err.status === 422) {
          message =
            'Revise os filtros de preço: o valor mínimo deve ser menor ou igual ao máximo.'
        } else {
          message = err.detail
        }
      }
      setError(message)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const active = filtersFromSearchParams(searchParams)
    void loadCatalog(active)
  }, [filterKey, loadCatalog, searchParams])

  function applyFilters(next: VehicleListFilters) {
    setSearchParams(searchParamsFromFilters(next), { replace: true })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="public-stack">
      <header className="catalog-header">
        <h1>Catálogo de veículos</h1>
        <p className="text-muted">
          Listagem de veículos com status <strong>disponível</strong>, conforme retorno
          da API.
        </p>
      </header>

      <VehicleFilters
        key={filterKey}
        initial={filters}
        onApply={applyFilters}
        onClear={clearFilters}
        disabled={loading}
      />

      {loading ? <LoadingMessage label="Carregando catálogo…" /> : null}

      {!loading && error ? (
        <ErrorMessage
          message={error}
          onRetry={() => void loadCatalog(filters)}
        />
      ) : null}

      {!loading && !error && vehicles.length === 0 ? (
        <EmptyMessage
          title="Nenhum veículo encontrado"
          message="Ajuste os filtros ou volte mais tarde."
          action={
            <Link to="/" className="btn-secondary btn-secondary--inline">
              Voltar ao início
            </Link>
          }
        />
      ) : null}

      {!loading && !error && vehicles.length > 0 ? (
        <>
          <p className="catalog-count text-muted" role="status">
            {vehicles.length} veículo{vehicles.length === 1 ? '' : 's'} encontrado
            {vehicles.length === 1 ? '' : 's'}
          </p>
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
