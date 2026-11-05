import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <article className="page-content page-content--centered">
      <h1>Página não encontrada</h1>
      <p className="text-muted">O endereço acessado não existe nesta aplicação.</p>
      <p>
        <Link to="/">Ir para o início</Link>
      </p>
    </article>
  )
}
