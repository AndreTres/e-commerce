type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <article className="page-content">
      <h1>{title}</h1>
      <p className="text-muted">
        {description ?? 'Conteúdo e integração com a API serão implementados em etapa posterior.'}
      </p>
    </article>
  )
}
