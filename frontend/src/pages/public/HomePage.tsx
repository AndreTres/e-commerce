import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { listVehicles } from '../../api/vehiclesApi'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { VehicleCard } from '../../components/vehicles/VehicleCard'
import type { Vehicle } from '../../types/vehicle'

const HIGHLIGHT_LIMIT = 6

export function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHighlights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVehicles()
      setVehicles(data.slice(0, HIGHLIGHT_LIMIT))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : 'Não foi possível carregar os veículos em destaque.'
      setError(message)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHighlights()
  }, [loadHighlights])

  return (
    <div className="public-stack">
      <section className="home-hero page-content">
        <h1>Concessionária AutoHub</h1>
        <p className="home-hero__lead">
          Veículos seminovos e usados com atendimento transparente. Explore o
          catálogo, compare modelos e inicie sua compra ou test drive após
          entrar na conta.
        </p>
        <div className="home-hero__actions">
          <Link to="/vehicles" className="btn-primary btn-primary--inline">
            Ver catálogo completo
          </Link>
          <Link to="/login" className="btn-secondary btn-secondary--inline">
            Entrar
          </Link>
        </div>
      </section>

      <section className="home-highlight" aria-labelledby="home-highlight-title">
        <div className="section-heading">
          <h2 id="home-highlight-title">Veículos disponíveis</h2>
          <p className="text-muted">
            Amostra dos carros com status disponível no estoque.
          </p>
        </div>

        {loading ? <LoadingMessage label="Carregando veículos…" /> : null}

        {!loading && error ? (
          <ErrorMessage message={error} onRetry={() => void loadHighlights()} />
        ) : null}

        {!loading && !error && vehicles.length === 0 ? (
          <EmptyMessage
            title="Nenhum veículo disponível no momento"
            message="Novos anúncios aparecerão aqui quando forem cadastrados."
            action={
              <Link to="/vehicles" className="btn-secondary btn-secondary--inline">
                Abrir catálogo
              </Link>
            }
          />
        ) : null}

        {!loading && !error && vehicles.length > 0 ? (
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="home-info page-content">
        <h2>Como funciona</h2>
        <ol className="home-steps">
          <li>Navegue pelo catálogo e consulte preço, quilometragem e descrição.</li>
          <li>Entre com sua conta de cliente para comprar, simular financiamento ou agendar test drive.</li>
          <li>Nossa equipe acompanha venda, pagamento e entrega conforme o fluxo da concessionária.</li>
        </ol>
      </section>
    </div>
  )
}
