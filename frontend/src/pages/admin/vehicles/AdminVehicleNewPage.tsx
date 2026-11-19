import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createVehicle } from '../../../api/vehiclesApi'
import { useAuth } from '../../../auth/AuthContext'
import { VehicleFormFields } from '../../../components/vehicles/VehicleFormFields'
import { translateVehicleError } from '../vehicleErrors'
import { parseVehicleForm } from './parseVehicleForm'

export function AdminVehicleNewPage() {
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()

  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [cor, setCor] = useState('')
  const [quilometragem, setQuilometragem] = useState('')
  const [preco, setPreco] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = getAccessToken()
    if (!token) {
      return
    }

    setSaving(true)
    setError(null)

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
      const created = await createVehicle(payload, token)
      navigate(`/admin/vehicles/${created.id}`, { replace: true })
    } catch (err) {
      let message = 'Não foi possível cadastrar o veículo.'
      if (err instanceof Error && err.message.startsWith('Revise os campos')) {
        message = err.message
      } else {
        message = translateVehicleError(err, message)
      }
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="page-content admin-vehicle-form-page">
      <p className="vehicle-detail__back">
        <Link to="/admin/vehicles">Voltar à listagem</Link>
      </p>
      <h1>Cadastrar veículo</h1>
      <p className="text-muted">
        O veículo será criado com status <strong>disponível</strong>, conforme a API.
      </p>

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

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Cadastrar'}
        </button>
      </form>
    </article>
  )
}