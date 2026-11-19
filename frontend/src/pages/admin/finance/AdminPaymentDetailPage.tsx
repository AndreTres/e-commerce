import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import { getPayment, updatePaymentStatus } from '../../../api/financeApi'
import { useAuth } from '../../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import { PaymentStatusBadge } from '../../../components/finance/PaymentStatusBadge'
import { SaleStatusBadge } from '../../../components/sales/SaleStatusBadge'
import type { Payment, PaymentStatus } from '../../../types/payment'
import {
  getAllowedPaymentTransitions,
  PAYMENT_STATUS_LABELS,
} from '../../../types/payment'
import { PAYMENT_METHOD_LABELS } from '../../../types/sale'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { translateFinanceError } from '../financeErrors'

export function AdminPaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { getAccessToken } = useAuth()

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [statusDraft, setStatusDraft] = useState<PaymentStatus>('PENDENTE')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const allowedTransitions = useMemo(
    () => (payment ? getAllowedPaymentTransitions(payment.status) : []),
    [payment],
  )

  const loadPayment = useCallback(async () => {
    if (!paymentId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    setNotFound(false)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const data = await getPayment(paymentId, token)
      setPayment(data)
      setStatusDraft(data.status)
    } catch (err) {
      setPayment(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(
          translateFinanceError(err, 'Não foi possível carregar o pagamento.'),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, paymentId])

  useEffect(() => {
    void loadPayment()
  }, [loadPayment])

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!payment || !paymentId) {
      return
    }

    if (statusDraft === payment.status) {
      setStatusError('Selecione um status diferente do atual.')
      return
    }

    if (!allowedTransitions.includes(statusDraft)) {
      setStatusError('A transição selecionada não é permitida para este pagamento.')
      return
    }

    const token = getAccessToken()
    if (!token) {
      return
    }

    setStatusSaving(true)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const updated = await updatePaymentStatus(paymentId, statusDraft, token)
      setPayment(updated)
      setStatusDraft(updated.status)
      setStatusSuccess('Status do pagamento atualizado com sucesso.')
    } catch (err) {
      setStatusError(
        translateFinanceError(err, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando pagamento…" />
  }

  if (notFound) {
    return (
      <div className="account-stack">
        <ErrorMessage
          title="Pagamento não encontrado"
          message="Verifique o identificador ou volte à listagem."
        />
        <p>
          <Link to="/admin/finance">Voltar à gestão financeira</Link>
        </p>
      </div>
    )
  }

  if (loadError || !payment) {
    return (
      <ErrorMessage
        title="Erro ao carregar pagamento"
        message={loadError ?? 'Ocorreu um erro inesperado.'}
        onRetry={() => void loadPayment()}
      />
    )
  }

  return (
    <div className="account-stack">
      <article className="page-content purchase-detail admin-payment-detail">
        <p className="vehicle-detail__back">
          <Link to="/admin/finance">Voltar à gestão financeira</Link>
        </p>

        <header className="purchase-detail__header">
          <div>
            <h1>{formatCurrency(payment.valor)}</h1>
            <p className="text-muted">Pagamento {payment.id}</p>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </header>

        <dl className="detail-list purchase-detail__grid">
          <dt>Data do pagamento</dt>
          <dd>{formatDateTime(payment.dataPagamento)}</dd>
          <dt>Tipo</dt>
          <dd>{PAYMENT_METHOD_LABELS[payment.tipo]}</dd>
          <dt>Status</dt>
          <dd>
            <PaymentStatusBadge status={payment.status} />
          </dd>
          <dt>Venda vinculada</dt>
          <dd>
            <Link to={`/admin/sales/${payment.venda.id}`}>{payment.venda.id}</Link>
          </dd>
          <dt>Status da venda</dt>
          <dd>
            <SaleStatusBadge status={payment.venda.status} />
          </dd>
          <dt>Valor total da venda</dt>
          <dd>{formatCurrency(payment.venda.valorTotal)}</dd>
          <dt>Cliente (ID)</dt>
          <dd>
            <Link to={`/admin/clients/${payment.venda.clienteId}`}>
              {payment.venda.clienteId}
            </Link>
          </dd>
          <dt>Veículo (ID)</dt>
          <dd>
            <Link to={`/admin/vehicles/${payment.venda.veiculoId}`}>
              {payment.venda.veiculoId}
            </Link>
          </dd>
        </dl>

        <section>
          <h2>Observações</h2>
          {payment.observacoes?.trim() ? (
            <p>{payment.observacoes}</p>
          ) : (
            <p className="text-muted">Nenhuma observação registrada.</p>
          )}
        </section>
      </article>

      <article className="page-content admin-payment-detail__status">
        <h2 className="admin-form-subtitle">Status do pagamento</h2>
        <p className="text-muted">
          Status atual: <strong>{PAYMENT_STATUS_LABELS[payment.status]}</strong>.
          Transições permitidas pelo servidor:{' '}
          {allowedTransitions.length > 0
            ? allowedTransitions.map((s) => PAYMENT_STATUS_LABELS[s]).join(', ')
            : 'nenhuma (pagamento finalizado).'}
        </p>

        {allowedTransitions.length > 0 ? (
          <form className="vehicle-status-form" onSubmit={handleStatusSubmit}>
            <div className="form-field">
              <label htmlFor="admin-payment-status-draft">Novo status</label>
              <select
                id="admin-payment-status-draft"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as PaymentStatus)}
                disabled={statusSaving}
              >
                <option value={payment.status}>
                  {PAYMENT_STATUS_LABELS[payment.status]} (atual)
                </option>
                {allowedTransitions.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {statusError ? (
              <p className="form-error" role="alert">
                {statusError}
              </p>
            ) : null}
            {statusSuccess ? (
              <p className="form-success" role="status">
                {statusSuccess}
              </p>
            ) : null}

            <button type="submit" className="btn-secondary" disabled={statusSaving}>
              {statusSaving ? 'Atualizando…' : 'Atualizar status'}
            </button>
          </form>
        ) : (
          <p className="text-muted" role="status">
            Não há alterações de status disponíveis para este pagamento.
          </p>
        )}
      </article>
    </div>
  )
}