import { Link } from 'react-router-dom'
import type { ClientProfile } from '../../types/client'
import { formatDateTime, formatDocument } from '../../utils/format'

type AdminClientListItemProps = {
  client: ClientProfile
}

export function AdminClientListItem({ client }: AdminClientListItemProps) {
  return (
    <article className="admin-client-item">
      <div className="admin-client-item__main">
        <h2 className="admin-client-item__title">
          <Link to={`/admin/clients/${client.id}`}>{client.nome}</Link>
        </h2>
        <p className="text-muted">
          {formatDocument(client.cpfCnpj)} · {client.email} · {client.telefone}
        </p>
      </div>
      <div className="admin-client-item__aside">
        <p className="text-muted admin-client-item__meta">
          Cadastro {formatDateTime(client.dataCadastro)}
        </p>
      </div>
    </article>
  )
}