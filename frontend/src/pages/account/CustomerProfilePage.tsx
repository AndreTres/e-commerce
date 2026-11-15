import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/errors'
import { getClient, updateClient } from '../../api/clientsApi'
import { useAuth } from '../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import type { ClientProfile } from '../../types/client'
import { formatDateTime, formatDocument } from '../../utils/format'

const PROFILE_LINK_ERROR =
  'Sua conta de usuário não está vinculada a um cadastro de cliente (cliente_id ausente). Entre em contato com a concessionária ou conclua o cadastro quando disponível.'

export function CustomerProfilePage() {
  const { clienteId, getAccessToken } = useAuth()

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [linkError, setLinkError] = useState(false)

  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')

  const populateForm = useCallback((data: ClientProfile) => {
    setNome(data.nome)
    setCpfCnpj(data.cpfCnpj)
    setEmail(data.email)
    setTelefone(data.telefone)
    setEndereco(data.endereco)
  }, [])

  const loadProfile = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setLinkError(false)
    setSuccess(null)

    if (!clienteId) {
      setLinkError(true)
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const data = await getClient(clienteId, token)
      setProfile(data)
      populateForm(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : 'Não foi possível carregar o perfil.'
      setError(message)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [clienteId, getAccessToken, populateForm])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) {
      return
    }

    const token = getAccessToken()
    if (!token) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateClient(
        profile.id,
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
      setSuccess('Dados atualizados com sucesso.')
    } catch (err) {
      let message = 'Não foi possível salvar as alterações.'
      if (err instanceof ApiError) {
        if (err.detail === 'CPF or CNPJ is already registered') {
          message = 'Este CPF/CNPJ já está cadastrado para outro cliente.'
        } else if (err.detail === 'Invalid telephone format') {
          message = 'Formato de telefone inválido.'
        } else {
          message = err.detail
        }
      }
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando perfil…" />
  }

  if (linkError) {
    return (
      <article className="page-content">
        <h1>Meu perfil</h1>
        <ErrorMessage title="Cadastro não localizado" message={PROFILE_LINK_ERROR} />
      </article>
    )
  }

  if (error && !profile) {
    return (
      <ErrorMessage
        title="Erro ao carregar perfil"
        message={error}
        onRetry={() => void loadProfile()}
      />
    )
  }

  return (
    <article className="page-content account-profile">
      <h1>Meu perfil</h1>
      {profile ? (
        <p className="text-muted">
          Cadastro desde {formatDateTime(profile.dataCadastro)}
        </p>
      ) : null}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="profile-nome">Nome</label>
          <input
            id="profile-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={200}
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="profile-cpf">CPF/CNPJ</label>
          <input
            id="profile-cpf"
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            required
            disabled={saving}
            aria-describedby="profile-cpf-hint"
          />
          <span id="profile-cpf-hint" className="field-hint">
            Atual: {profile ? formatDocument(profile.cpfCnpj) : '—'}
          </span>
        </div>
        <div className="form-field">
          <label htmlFor="profile-email">E-mail</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="profile-telefone">Telefone</label>
          <input
            id="profile-telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            maxLength={20}
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label htmlFor="profile-endereco">Endereço</label>
          <input
            id="profile-endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
            maxLength={500}
            disabled={saving}
          />
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="form-success" role="status">
            {success}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>
    </article>
  )
}
