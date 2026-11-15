import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { getVehicle } from '../../api/vehiclesApi'
import { useAuth } from '../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { VehicleStatusBadge } from '../../components/vehicles/VehicleStatusBadge'
import type { Vehicle } from '../../types/vehicle'
import { formatCurrency, formatMileage } from '../../utils/format'

export function VehicleDetailsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const { user } = useAuth()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const data = await getVehicle(vehicleId)
      setVehicle(data)
    } catch (err) {
      setVehicle(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        const message =
          err instanceof ApiError
            ? err.detail
            : 'Não foi possível carregar este veículo.'
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => {
    void loadVehicle()
  }, [loadVehicle])

  if (loading) {
    return <LoadingMessage label="Carregando veículo…" />
  }

  if (notFound) {
    return (
      <article className="page-content">
        <h1>Veículo não encontrado</h1>
        <p className="text-muted">O veículo solicitado não existe ou foi removido.</p>
        <Link to="/vehicles">Voltar ao catálogo</Link>
      </article>
    )
  }

  if (error || !vehicle) {
    return (
      <ErrorMessage
        title="Erro ao carregar veículo"
        message={error ?? 'Ocorreu um erro inesperado.'}
        onRetry={() => void loadVehicle()}
      />
    )
  }

  const title = `${vehicle.marca} ${vehicle.modelo}`
  const isAvailable = vehicle.status === 'DISPONIVEL'
  const isClient = user?.role === 'CLIENT'

  return (
    <article className="vehicle-detail page-content">
      <p className="vehicle-detail__back">
        <Link to="/vehicles">← Voltar ao catálogo</Link>
      </p>

      <header className="vehicle-detail__header">
        <div>
          <h1>{title}</h1>
          <p className="vehicle-detail__subtitle text-muted">
            {vehicle.ano} · {vehicle.cor}
          </p>
        </div>
        <VehicleStatusBadge status={vehicle.status} />
      </header>

      <div className="vehicle-detail__layout">
        <div className="vehicle-detail__visual" aria-hidden="true">
          <span>{vehicle.marca.charAt(0)}</span>
        </div>

        <div className="vehicle-detail__info">
          <dl className="detail-list">
            <dt>Preço</dt>
            <dd className="vehicle-detail__price">{formatCurrency(vehicle.preco)}</dd>
            <dt>Quilometragem</dt>
            <dd>{formatMileage(vehicle.quilometragem)}</dd>
            <dt>Ano</dt>
            <dd>{vehicle.ano}</dd>
            <dt>Cor</dt>
            <dd>{vehicle.cor}</dd>
            <dt>Status</dt>
            <dd>
              <VehicleStatusBadge status={vehicle.status} />
            </dd>
          </dl>

          <section className="vehicle-detail__description">
            <h2>Descrição</h2>
            {vehicle.descricao.trim() ? (
              <p>{vehicle.descricao}</p>
            ) : (
              <p className="text-muted">Sem descrição adicional informada.</p>
            )}
          </section>

          <section className="vehicle-detail__actions" aria-label="Próximos passos">
            {isAvailable ? (
              <p>
                Este veículo está disponível no estoque. Compra, test drive e simulação
                de financiamento exigem conta de cliente — serão implementados nas
                próximas etapas.
              </p>
            ) : (
              <p className="text-muted">
                Este veículo não está disponível para nova compra. O status exibido é o
                retornado pela API.
              </p>
            )}

            {!user ? (
              <Link to="/login" className="btn-primary btn-primary--inline">
                Entrar para continuar
              </Link>
            ) : null}

            {user && isClient && isAvailable ? (
              <p className="text-muted">
                Você está autenticado como cliente. Os fluxos de compra, test drive e
                financiamento serão habilitados em breve.
              </p>
            ) : null}

            {user && !isClient ? (
              <p className="text-muted">
                Contas de colaborador utilizam o painel administrativo para operações de
                venda.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </article>
  )
}
