type AdminSummaryCardProps = {
  label: string
  value: string
  hint?: string
}

export function AdminSummaryCard({ label, value, hint }: AdminSummaryCardProps) {
  return (
    <article className="admin-summary-card">
      <p className="admin-summary-card__label">{label}</p>
      <p className="admin-summary-card__value">{value}</p>
      {hint ? <p className="admin-summary-card__hint text-muted">{hint}</p> : null}
    </article>
  )
}