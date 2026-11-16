import { Link } from 'react-router-dom'
import type { Payment } from '../../types/payment'
import { PAYMENT_METHOD_LABELS } from '../../types/sale'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { PaymentStatusBadge } from './PaymentStatusBadge'

type AdminPaymentListItemProps = {
  payment: Payment
}

export function AdminPaymentListItem({ payment }: AdminPaymentListItemProps) {
  return (
    <article className="admin-payment-item">
      <div className="admin-payment-item__main">
        <h2 className="admin-payment-item__title">
          <Link to={`/admin/finance/payments/${payment.id}`}>
            {formatCurrency(payment.valor)}
          </Link>
        </h2>
        <p className="text-muted admin-payment-item__meta">
          {formatDateTime(payment.dataPagamento)} · {PAYMENT_METHOD_LABELS[payment.tipo]} ·
          Venda {payment.vendaId.slice(0, 8)}…
        </p>
      </div>
      <div className="admin-payment-item__aside">
        <PaymentStatusBadge status={payment.status} />
      </div>
    </article>
  )
}