import type { ReactNode } from 'react'

type LoadingMessageProps = {
  label?: string
}

export function LoadingMessage({ label = 'Carregando…' }: LoadingMessageProps) {
  return (
    <p className="state-message" role="status" aria-live="polite">
      {label}
    </p>
  )
}

type ErrorMessageProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({
  title = 'Não foi possível carregar os dados',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <article className="feedback-box feedback-box--error" role="alert">
      <h2 className="feedback-title">{title}</h2>
      <p className="text-muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </article>
  )
}

type EmptyMessageProps = {
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyMessage({ title, message, action }: EmptyMessageProps) {
  return (
    <div className="feedback-box feedback-box--empty">
      <h2 className="feedback-title">{title}</h2>
      {message ? <p className="text-muted">{message}</p> : null}
      {action}
    </div>
  )
}
