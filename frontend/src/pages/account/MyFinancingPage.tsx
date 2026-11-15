import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import {
  createFinancingSimulation,
  getFinancingSimulation,
  listFinancingSimulations,
} from '../../api/financingApi'
import { listVehicles } from '../../api/vehiclesApi'
import { useAuth } from '../../auth/AuthContext'
import { FinancingSimulationDetails } from '../../components/financing/FinancingSimulationDetails'
import { FinancingSimulationListItem } from '../../components/financing/FinancingSimulationListItem'
import {
  EmptyMessage,
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import type { FinancingSimulation } from '../../types/financing'
import type { Vehicle } from '../../types/vehicle'
import { formatCurrency } from '../../utils/format'
import { translateFinancingError } from './financingErrors'

const CLIENT_PROFILE_REQUIRED =
  'Authenticated client account is not linked to a customer record'

export function MyFinancingPage() {
  const { getAccessToken, clienteId } = useAuth()

  const [simulations, setSimulations] = useState<FinancingSimulation[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)

  const [loadingList, setLoadingList] = useState(true)
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState('')
  const [valorEntrada, setValorEntrada] = useState('')
  const [prazoMeses, setPrazoMeses] = useState('48')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [lastSimulation, setLastSimulation] = useState<FinancingSimulation | null>(
    null,
  )

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicleId, vehicles],
  )

  const loadSimulations = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoadingList(false)
      return
    }

    setLoadingList(true)
    setListError(null)

    try {
      const data = await listFinancingSimulations(token)
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.dataSimulacao).getTime() - new Date(a.dataSimulacao).getTime(),
      )
      setSimulations(sorted)
    } catch (err) {
      let message = 'Não foi possível carregar o histórico.'
      if (err instanceof ApiError && err.detail === CLIENT_PROFILE_REQUIRED) {
        message =
          'Sua conta não está vinculada a um cadastro de cliente. Contate a concessionária.'
      } else {
        message = translateFinancingError(err, message)
      }
      setListError(message)
      setSimulations([])
    } finally {
      setLoadingList(false)
    }
  }, [getAccessToken])

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true)
    try {
      const data = await listVehicles()
      setVehicles(data)
      if (data.length > 0) {
        setVehicleId((current) => current || data[0].id)
      }
    } catch {
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  useEffect(() => {
    void loadSimulations()
  }, [loadSimulations])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = getAccessToken()
    if (!token) {
      return
    }

    if (!clienteId) {
      setFormError('Sua conta não está vinculada a um cadastro de cliente.')
      return
    }

    if (!vehicleId || !valorEntrada.trim() || !prazoMeses.trim()) {
      setFormError('Preencha veículo, entrada e prazo.')
      return
    }

    const prazo = Number.parseInt(prazoMeses, 10)
    if (Number.isNaN(prazo) || prazo < 1 || prazo > 120) {
      setFormError('O prazo deve ser entre 1 e 120 meses.')
      return
    }

    const entrada = Number(valorEntrada.replace(',', '.'))
    if (Number.isNaN(entrada) || entrada < 0) {
      setFormError('Informe um valor de entrada válido.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const created = await createFinancingSimulation(
        {
          veiculo_id: vehicleId,
          valor_entrada: entrada,
          prazo_meses: prazo,
        },
        token,
      )
      setLastSimulation(created)
      setFormSuccess(
        'Simulação registrada. Os valores abaixo foram calculados pelo servidor.',
      )
      await loadSimulations()
    } catch (err) {
      setFormError(
        translateFinancingError(err, 'Não foi possível concluir a simulação.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshSimulationDetail(id: string) {
    const token = getAccessToken()
    if (!token) {
      return
    }

    setDetailLoadingId(id)
    try {
      const fresh = await getFinancingSimulation(id, token)
      setSimulations((current) =>
        current.map((item) => (item.id === id ? fresh : item)),
      )
    } catch {
      // Mantém dados da listagem se o detalhe falhar.
    } finally {
      setDetailLoadingId(null)
    }
  }

  return (
    <div className="account-stack">
      <header className="account-page-header">
        <h1>Financiamento</h1>
        <p className="text-muted">
          Simule parcelas com base no preço do veículo e parâmetros da concessionária.
          Isto não representa aprovação de crédito nem víncula venda.
        </p>
      </header>

      <section className="page-content test-drive-schedule">
        <h2>Nova simulação</h2>
        {!clienteId ? (
          <p className="form-error" role="alert">
            Vincule sua conta a um cadastro de cliente para simular financiamento.
          </p>
        ) : null}

        <form className="test-drive-form financing-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="fin-vehicle">Veículo</label>
            <select
              id="fin-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={submitting || loadingVehicles || !clienteId}
              required
            >
              {loadingVehicles ? <option value="">Carregando veículos…</option> : null}
              {!loadingVehicles && vehicles.length === 0 ? (
                <option value="">Nenhum veículo disponível</option>
              ) : null}
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle ? (
            <p className="field-hint">
              Preço de referência no catálogo:{' '}
              <strong>{formatCurrency(selectedVehicle.preco)}</strong>. O valor usado na
              simulação é definido pelo servidor a partir do cadastro do veículo.
            </p>
          ) : null}

          <div className="form-field">
            <label htmlFor="fin-entrada">Valor de entrada (R$)</label>
            <input
              id="fin-entrada"
              inputMode="decimal"
              value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)}
              required
              disabled={submitting || !clienteId}
            />
          </div>

          <div className="form-field">
            <label htmlFor="fin-prazo">Prazo (meses)</label>
            <input
              id="fin-prazo"
              type="number"
              min={1}
              max={120}
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(e.target.value)}
              required
              disabled={submitting || !clienteId}
            />
          </div>

          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
          {formSuccess ? (
            <p className="form-success" role="status">
              {formSuccess}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !clienteId || vehicles.length === 0}
          >
            {submitting ? 'Simulando…' : 'Simular financiamento'}
          </button>
        </form>

        {vehicles.length === 0 && !loadingVehicles ? (
          <p className="text-muted">
            <Link to="/vehicles">Ver catálogo de veículos</Link>
          </p>
        ) : null}
      </section>

      {lastSimulation ? (
        <section className="page-content financing-last-result" aria-live="polite">
          <h2>Resultado da última simulação</h2>
          <FinancingSimulationDetails simulation={lastSimulation} />
        </section>
      ) : null}

      <section aria-labelledby="financing-history-title">
        <h2 id="financing-history-title" className="section-heading">
          Histórico
        </h2>

        {loadingList ? <LoadingMessage label="Carregando simulações…" /> : null}

        {!loadingList && listError ? (
          <ErrorMessage message={listError} onRetry={() => void loadSimulations()} />
        ) : null}

        {!loadingList && !listError && simulations.length === 0 ? (
          <EmptyMessage
            title="Nenhuma simulação encontrada"
            message="Crie uma simulação acima para ver o histórico aqui."
            action={
              <Link to="/vehicles" className="btn-secondary btn-secondary--inline">
                Explorar catálogo
              </Link>
            }
          />
        ) : null}

        {!loadingList && !listError && simulations.length > 0 ? (
          <div className="financing-list">
            {simulations.map((simulation) => (
              <FinancingSimulationListItem
                key={simulation.id}
                simulation={simulation}
                loadingDetail={detailLoadingId === simulation.id}
                onExpand={refreshSimulationDetail}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}