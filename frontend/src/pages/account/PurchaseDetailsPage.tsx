import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { getSale } from '../../api/salesApi'
import { useAuth } from '../../auth/AuthContext'
import {
  ErrorMessage,
  LoadingMessage,
} from '../../components/feedback/AsyncFeedback'
import { SaleStatusBadge } from '../../components/sales/SaleStatusBadge'
import type { Sale } from '../../types/sale'
import { PAYMENT_METHOD_LABELS } from '../../types/sale'
import { formatCurrency, formatDateTime } from '../../utils/format'

export function PurchaseDetailsPage() {
  const { saleId } = useParams<{ saleId: string }>()
  const { getAccessToken } = useAuth()

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSale = useCallback(async () => {
    const token = getAccessToken()
    if (!saleId || !token) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)
    setForbidden(false)

    try {
      const data = await getSale(saleId, token)
      setSale(data)
    } catch (err) {
      setSale(null)
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setNotFound(true)
        } else if (err.status === 403 || err.detail === 'Access to this sale is not allowed') {
          setForbidden(true)
        } else {
          setError(err.detail)
        }
      } else {
        setError('Não foi possível carregar esta compra.')
      }
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, saleId])

  useEffect(() => {
    void loadSale()
  }, [loadSale])

  if (loading) {
    return <LoadingMessage label="Carregando compra…" />
  }

  if (forbidden) {
    return (
      <article className="page-content">
        <h1>Acesso negado</h1>
        <p className="text-muted">Esta compra não pertence à sua conta.</p>
        <Link to="/account/purchases">Voltar às compras</Link>
      </article>
    )
  }

  if (notFound) {
    return (
      <article className="page-content">
        <h1>Compra não encontrada</h1>
        <p className="text-muted">O identificador informado não corresponde a uma venda.</p>
        <Link to="/account/purchases">Voltar às compras</Link>
      </article>
    )
  }

  if (error || !sale) {
    return (
      <ErrorMessage
        title="Erro ao carregar compra"
        message={error ?? 'Ocorreu um erro inesperado.'}
        onRetry={() => void loadSale()}
      />
    )
  }

  const vehicleTitle = `${sale.veiculo.marca} ${sale.veiculo.modelo}`

  return (
    <article className="page-content purchase-detail">
      <p className="vehicle-detail__back">
        <Link to="/account/purchases">← Voltar às compras</Link>
      </p>

      <header className="purchase-detail__header">
        <div>
          <h1>{vehicleTitle}</h1>
          <p className="text-muted">Compra #{sale.id.slice(0, 8)}</p>
        </div>
        <SaleStatusBadge status={sale.status} />
      </header>

      <dl className="detail-list purchase-detail__grid">
        <dt>Data da compra</dt>
        <dd>{formatDateTime(sale.dataVenda)}</dd>
        <dt>Valor total</dt>
        <dd className="vehicle-detail__price">{formatCurrency(sale.valorTotal)}</dd>
        <dt>Forma de pagamento informada</dt>
        <dd>{PAYMENT_METHOD_LABELS[sale.formaPagamento]}</dd>
        <dt>Status da venda</dt>
        <dd>
          <SaleStatusBadge status={sale.status} />
        </dd>
        <dt>Cliente</dt>
        <dd>{sale.cliente.nome}</dd>
        <dt>E-mail</dt>
        <dd>{sale.cliente.email}</dd>
        <dt>Veículo</dt>
        <dd>
          <Link to={`/vehicles/${sale.veiculo.id}`}>
            {vehicleTitle} ({sale.veiculo.ano})
          </Link>
        </dd>
        <dt>Status do veículo</dt>
        <dd>{sale.veiculo.status}</dd>
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
  )
}
