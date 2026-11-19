import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import {
  getVehicle,
  updateVehicle,
  updateVehicleStatus,
} from '../../../api/vehiclesApi'
import { useAuth } from '../../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import { VehicleFormFields } from '../../../components/vehicles/VehicleFormFields'
import { VehicleStatusBadge } from '../../../components/vehicles/VehicleStatusBadge'
import type { Vehicle, VehicleStatus } from '../../../types/vehicle'
import { VEHICLE_STATUSES, VEHICLE_STATUS_LABELS } from '../../../types/vehicle'
import { translateVehicleError } from '../vehicleErrors'
import { parseVehicleForm } from './parseVehicleForm'

export function AdminVehicleEditPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const { getAccessToken } = useAuth()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [cor, setCor] = useState('')
  const [quilometragem, setQuilometragem] = useState('')
  const [preco, setPreco] = useState('')
  const [descricao, setDescricao] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const [statusDraft, setStatusDraft] = useState<VehicleStatus>('DISPONIVEL')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const populateForm = useCallback((data: Vehicle) => {
    setMarca(data.marca)
    setModelo(data.modelo)
    setAno(String(data.ano))
    setCor(data.cor)
    setQuilometragem(String(data.quilometragem))
    setPreco(data.preco)
    setDescricao(data.descricao)
    setStatusDraft(data.status)
  }, [])

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    setNotFound(false)

    try {
      const data = await getVehicle(vehicleId)
      setVehicle(data)
      populateForm(data)
    } catch (err) {
      setVehicle(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(
          translateVehicleError(err, 'Não foi possível carregar o veículo.'),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [populateForm, vehicleId])

  useEffect(() => {
    void loadVehicle()
  }, [loadVehicle])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vehicleId) {
      return
    }
    const token = getAccessToken()
    if (!token) {
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const payload = parseVehicleForm({
        marca,
        modelo,
        ano,
        cor,
        quilometragem,
        preco,
        descricao,
      })
      const updated = await updateVehicle(vehicleId, payload, token)
      setVehicle(updated)
      populateForm(updated)
      setSaveSuccess('Dados do veículo atualizados.')
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('Revise os campos')
          ? err.message
          : translateVehicleError(err, 'Não foi possível salvar as alterações.')
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vehicleId || !vehicle) {
      return
    }
    const token = getAccessToken()
    if (!token) {
      return
    }

    if (statusDraft === vehicle.status) {
      setStatusError('Selecione um status diferente do atual.')
      return
    }

    setStatusSaving(true)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const updated = await updateVehicleStatus(vehicleId, statusDraft, token)
      setVehicle(updated)
      populateForm(updated)
      setStatusSuccess('Status atualizado.')
    } catch (err) {
      setStatusError(
        translateVehicleError(err, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando veículo…" />
  }

  if (notFound) {
    return (
      <article className="page-content">
        <h1>Veículo não encontrado</h1>
        <Link to="/admin/vehicles">Voltar à listagem</Link>
      </article>
    )
  }

  if (loadError || !vehicle) {
    return (
      <ErrorMessage
        message={loadError ?? 'Erro inesperado.'}
        onRetry={() => void loadVehicle()}
      />
    )
  }

  const title = `${vehicle.marca} ${vehicle.modelo}`

  return (
    <div className="account-stack">
      <article className="page-content admin-vehicle-form-page">
        <p className="vehicle-detail__back">
          <Link to="/admin/vehicles">Voltar à listagem</Link>
        </p>
        <header className="purchase-detail__header">
          <div>
            <h1>{title}</h1>
            <p className="text-muted">ID {vehicle.id}</p>
          </div>
          <VehicleStatusBadge status={vehicle.status} />
        </header>

        <h2 className="admin-form-subtitle">Dados do veículo</h2>
        <form className="vehicle-admin-form" onSubmit={handleSubmit}>
          <VehicleFormFields
            marca={marca}
            modelo={modelo}
            ano={ano}
            cor={cor}
            quilometragem={quilometragem}
            preco={preco}
            descricao={descricao}
            disabled={saving}
            onMarcaChange={setMarca}
            onModeloChange={setModelo}
            onAnoChange={setAno}
            onCorChange={setCor}
            onQuilometragemChange={setQuilometragem}
            onPrecoChange={setPreco}
            onDescricaoChange={setDescricao}
          />

          {saveError ? (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className="form-success" role="status">
              {saveSuccess}
            </p>
          ) : null}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </form>
      </article>

      <article className="page-content admin-vehicle-form-page">
        <h2 className="admin-form-subtitle">Status</h2>
        <p className="text-muted">
          As transições válidas são definidas pelo servidor. Veículos vendidos não podem
          ser alterados.
        </p>

        <form className="vehicle-status-form" onSubmit={handleStatusSubmit}>
          <div className="form-field">
            <label htmlFor="vehicle-status">Novo status</label>
            <select
              id="vehicle-status"
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as VehicleStatus)}
              disabled={statusSaving}
            >
              {VEHICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {VEHICLE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {statusError ? (
            <p className="form-error" role="alert">
              {statusError}
            </p>
          ) : null}
          {statusSuccess ? (
            <p className="form-success" role="status">
              {statusSuccess}
            </p>
          ) : null}

          <button type="submit" className="btn-secondary" disabled={statusSaving}>
            {statusSaving ? 'Atualizando…' : 'Atualizar status'}
          </button>
        </form>

        <p className="text-muted">
          <Link to={`/vehicles/${vehicle.id}`}>Ver ficha pública</Link>
        </p>
      </article>
    </div>
  )
}