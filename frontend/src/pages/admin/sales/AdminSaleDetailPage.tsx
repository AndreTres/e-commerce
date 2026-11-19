import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/errors'
import { getSale, updateSaleStatus } from '../../../api/salesApi'
import { useAuth } from '../../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../../components/feedback/AsyncFeedback'
import { SaleStatusBadge } from '../../../components/sales/SaleStatusBadge'
import { VehicleStatusBadge } from '../../../components/vehicles/VehicleStatusBadge'
import type { Sale, SaleStatus } from '../../../types/sale'
import {
  getAllowedSaleTransitions,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
} from '../../../types/sale'
import type { VehicleStatus } from '../../../types/vehicle'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { translateSaleError } from '../saleErrors'

export function AdminSaleDetailPage() {
  const { saleId } = useParams<{ saleId: string }>()
  const { getAccessToken } = useAuth()

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [statusDraft, setStatusDraft] = useState<SaleStatus>('PENDENTE')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const allowedTransitions = useMemo(
    () => (sale ? getAllowedSaleTransitions(sale.status) : []),
    [sale],
  )

  const loadSale = useCallback(async () => {
    if (!saleId) {
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
      const data = await getSale(saleId, token)
      setSale(data)
      setStatusDraft(data.status)
    } catch (err) {
      setSale(null)
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setLoadError(translateSaleError(err, 'Não foi possível carregar a venda.'))
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, saleId])

  useEffect(() => {
    void loadSale()
  }, [loadSale])

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sale || !saleId) {
      return
    }

    if (statusDraft === sale.status) {
      setStatusError('Selecione um status diferente do atual.')
      return
    }

    if (!allowedTransitions.includes(statusDraft)) {
      setStatusError('A transição selecionada não é permitida para esta venda.')
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
      const updated = await updateSaleStatus(saleId, statusDraft, token)
      setSale(updated)
      setStatusDraft(updated.status)
      setStatusSuccess('Status da venda atualizado com sucesso.')
    } catch (err) {
      setStatusError(
        translateSaleError(err, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <LoadingMessage label="Carregando venda…" />
  }

  if (notFound) {
    return (
      <div className="account-stack">
        <ErrorMessage
          title="Venda não encontrada"
          message="Verifique o identificador ou volte à listagem."
        />
        <p>
          <Link to="/admin/sales">Voltar à gestão de vendas</Link>
        </p>
      </div>
    )
  }

  if (loadError || !sale) {
    return (
      <ErrorMessage
        title="Erro ao carregar venda"
        message={loadError ?? 'Ocorreu um erro inesperado.'}
        onRetry={() => void loadSale()}
      />
    )
  }

  const vehicleTitle = `${sale.veiculo.marca} ${sale.veiculo.modelo}`
  const vehicleStatus = sale.veiculo.status as VehicleStatus

  return (
    <div className="account-stack">
      <article className="page-content purchase-detail admin-sale-detail">
        <p className="vehicle-detail__back">
          <Link to="/admin/sales">Voltar à listagem</Link>
        </p>

        <header className="purchase-detail__header">
          <div>
            <h1>{vehicleTitle}</h1>
            <p className="text-muted">Venda {sale.id}</p>
          </div>
          <SaleStatusBadge status={sale.status} />
        </header>

        <dl className="detail-list purchase-detail__grid">
          <dt>Data da venda</dt>
          <dd>{formatDateTime(sale.dataVenda)}</dd>
          <dt>Valor total</dt>
          <dd className="vehicle-detail__price">{formatCurrency(sale.valorTotal)}</dd>
          <dt>Forma de pagamento</dt>
          <dd>{PAYMENT_METHOD_LABELS[sale.formaPagamento]}</dd>
          <dt>Cliente</dt>
          <dd>
            <Link to={`/admin/clients/${sale.cliente.id}`}>{sale.cliente.nome}</Link>
            <span className="text-muted"> · {sale.cliente.email}</span>
          </dd>
          <dt>Veículo</dt>
          <dd>
            <Link to={`/admin/vehicles/${sale.veiculo.id}`}>
              {vehicleTitle} ({sale.veiculo.ano})
            </Link>
          </dd>
          <dt>Status do veículo</dt>
          <dd>
            <VehicleStatusBadge status={vehicleStatus} />
          </dd>
          <dt>Preço do veículo</dt>
          <dd>{formatCurrency(sale.veiculo.preco)}</dd>
        </dl>

        <section>
          <h2>Observações</h2>
          {sale.observacoes?.trim() ? (
            <p>{sale.observacoes}</p>
          ) : (
            <p className="text-muted">Nenhuma observação registrada.</p>
          )}
        </section>
      </article>

      <article className="page-content admin-sale-detail__status">
        <h2 className="admin-form-subtitle">Status da venda</h2>
        <p className="text-muted">
          Status atual: <strong>{SALE_STATUS_LABELS[sale.status]}</strong>. Transições
          permitidas pelo servidor:{' '}
          {allowedTransitions.length > 0
            ? allowedTransitions.map((s) => SALE_STATUS_LABELS[s]).join(', ')
            : 'nenhuma (venda finalizada).'}
        </p>

        {allowedTransitions.length > 0 ? (
          <form className="vehicle-status-form" onSubmit={handleStatusSubmit}>
            <div className="form-field">
              <label htmlFor="admin-sale-status">Novo status</label>
              <select
                id="admin-sale-status"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as SaleStatus)}
                disabled={statusSaving}
              >
                <option value={sale.status}>{SALE_STATUS_LABELS[sale.status]} (atual)</option>
                {allowedTransitions.map((status) => (
                  <option key={status} value={status}>
                    {SALE_STATUS_LABELS[status]}
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
            Não há alterações de status disponíveis para esta venda.
          </p>
        )}
      </article>
    </div>
  )
}