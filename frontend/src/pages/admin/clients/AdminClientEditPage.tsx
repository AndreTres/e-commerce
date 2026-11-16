import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import { getClient, updateClient } from '../../../api/clientsApi'
import { useAuth } from '../../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import type { ClientProfile } from '../../../types/client'
import { formatDateTime, formatDocument } from '../../../utils/format'
import { translateClientError } from '../clientErrors'

export function AdminClientEditPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { getAccessToken } = useAuth()

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const populateForm = useCallback((data: ClientProfile) => {
    setNome(data.nome)
    setCpfCnpj(data.cpfCnpj)
    setEmail(data.email)
    setTelefone(data.telefone)
    setEndereco(data.endereco)
  }, [])

  const loadClient = useCallback(async () => {
    if (!clientId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    setNotFound(false)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const data = await getClient(clientId, token)
      setProfile(data)
      populateForm(data)
    } catch (err) {
      setProfile(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(
          translateClientError(err, 'Não foi possível carregar o cliente.'),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [clientId, getAccessToken, populateForm])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || !clientId) {
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
      const updated = await updateClient(
        clientId,
        {
          nome: nome.trim(),
          cpf_cnpj: cpfCnpj.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        },
        token,
      )
      setProfile(updated)
      populateForm(updated)
      setSaveSuccess('Dados do cliente atualizados com sucesso.')
    } catch (err) {
      setSaveError(
        translateClientError(err, 'Não foi possível salvar as alterações.'),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando cliente…" />
  }

  if (notFound) {
    return (
      <div className="account-stack">
        <ErrorMessage
          title="Cliente não encontrado"
          message="Verifique o identificador ou volte à listagem."
        />
        <p>
          <Link to="/admin/clients">Voltar à gestão de clientes</Link>
        </p>
      </div>
    )
  }

  if (loadError && !profile) {
    return (
      <ErrorMessage
        title="Erro ao carregar cliente"
        message={loadError}
        onRetry={() => void loadClient()}
      />
    )
  }

  return (
    <div className="account-stack">
      <article className="page-content account-profile admin-client-form-page">
      <p className="vehicle-detail__back">
        <Link to="/admin/clients">← Voltar à listagem</Link>
      </p>

      <h1>Cliente — detalhes e edição</h1>
      {profile ? (
        <p className="text-muted">
          Cadastro desde {formatDateTime(profile.dataCadastro)} · ID {profile.id}
        </p>
      ) : null}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="admin-client-nome">Nome</label>
          <input
            id="admin-client-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={200}
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="admin-client-cpf">CPF/CNPJ</label>
          <input
            id="admin-client-cpf"
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            required
            disabled={saving}
            aria-describedby="admin-client-cpf-hint"
          />
          <span id="admin-client-cpf-hint" className="field-hint">
            Atual: {profile ? formatDocument(profile.cpfCnpj) : '—'}
          </span>
        </div>
        <div className="form-field">
          <label htmlFor="admin-client-email">E-mail</label>
          <input
            id="admin-client-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="admin-client-telefone">Telefone</label>
          <input
            id="admin-client-telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            maxLength={20}
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="admin-client-endereco">Endereço</label>
          <input
            id="admin-client-endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
            maxLength={500}
            disabled={saving}
          />
        </div>

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
    </div>
  )
}