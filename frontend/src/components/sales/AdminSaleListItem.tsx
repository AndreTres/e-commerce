import { Link } from 'react-router-dom'
import type { Sale } from '../../types/sale'
import { PAYMENT_METHOD_LABELS } from '../../types/sale'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { SaleStatusBadge } from './SaleStatusBadge'

type AdminSaleListItemProps = {
  sale: Sale
}

export function AdminSaleListItem({ sale }: AdminSaleListItemProps) {
  const vehicleTitle = `${sale.veiculo.marca} ${sale.veiculo.modelo}`

  return (
    <article className="sale-list-item">
      <div className="sale-list-item__main">
        <h2 className="sale-list-item__title">
          <Link to={`/admin/sales/${sale.id}`}>{vehicleTitle}</Link>
        </h2>
        <p className="text-muted sale-list-item__meta">
          {formatDateTime(sale.dataVenda)} · {sale.cliente.nome} ·{' '}
          {PAYMENT_METHOD_LABELS[sale.formaPagamento]}
        </p>
      </div>
      <div className="sale-list-item__aside">
        <SaleStatusBadge status={sale.status} />
        <p className="sale-list-item__price">{formatCurrency(sale.valorTotal)}</p>
      </div>
    </article>
  )
}