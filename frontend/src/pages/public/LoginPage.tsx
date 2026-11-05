import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { resolvePostLoginPath } from '../../auth/redirects'

const INVALID_LOGIN_MESSAGE = 'Invalid email or password'

type LocationState = {
  from?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const user = await login(email.trim(), password)
      const target = resolvePostLoginPath(user.role, from)
      navigate(target, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(
            err.detail === INVALID_LOGIN_MESSAGE
              ? 'E-mail ou senha inválidos.'
              : 'E-mail ou senha inválidos.',
          )
        } else if (err.status === 0) {
          setError(err.detail)
        } else {
          setError('Não foi possível entrar. Tente novamente.')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="page-content login-page">
      <h1>Entrar</h1>
      <p className="text-muted">
        Use suas credenciais de acesso. Colaboradores e clientes entram pelo mesmo formulário.
      </p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="login-footer">
        <Link to="/vehicles">Ver catálogo de veículos</Link>
      </p>
    </article>
  )
}
