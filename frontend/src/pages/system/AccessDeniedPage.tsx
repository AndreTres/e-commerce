import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <article className="page-content page-content--centered">
      <h1>Acesso negado</h1>
      <p className="text-muted">
        Você não tem permissão para acessar esta página com o perfil atual.
      </p>
      <p>
        <Link to="/">Voltar ao início</Link>
      </p>
    </article>
  )
}
