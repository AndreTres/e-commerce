import type { VehicleListFilters } from '../../types/vehicle'

export function filtersFromSearchParams(
  searchParams: URLSearchParams,
): VehicleListFilters {
  const anoRaw = searchParams.get('ano')
  let ano: number | undefined
  if (anoRaw) {
    const parsed = Number.parseInt(anoRaw, 10)
    if (!Number.isNaN(parsed)) {
      ano = parsed
    }
  }

  return {
    marca: searchParams.get('marca') ?? undefined,
    modelo: searchParams.get('modelo') ?? undefined,
    ano,
    cor: searchParams.get('cor') ?? undefined,
    preco_min: searchParams.get('preco_min') ?? undefined,
    preco_max: searchParams.get('preco_max') ?? undefined,
  }
}

export function searchParamsFromFilters(
  filters: VehicleListFilters,
): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.marca) {
    params.set('marca', filters.marca)
  }
  if (filters.modelo) {
    params.set('modelo', filters.modelo)
  }
  if (filters.ano !== undefined) {
    params.set('ano', String(filters.ano))
  }
  if (filters.cor) {
    params.set('cor', filters.cor)
  }
  if (filters.preco_min) {
    params.set('preco_min', filters.preco_min)
  }
  if (filters.preco_max) {
    params.set('preco_max', filters.preco_max)
  }
  return params
}
