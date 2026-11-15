import { type FormEvent, useState } from 'react'
import type { VehicleListFilters } from '../../types/vehicle'

type VehicleFiltersProps = {
  initial: VehicleListFilters
  onApply: (filters: VehicleListFilters) => void
  onClear: () => void
  disabled?: boolean
}

function parseAno(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

export function VehicleFilters({
  initial,
  onApply,
  onClear,
  disabled,
}: VehicleFiltersProps) {
  const [marca, setMarca] = useState(initial.marca ?? '')
  const [modelo, setModelo] = useState(initial.modelo ?? '')
  const [ano, setAno] = useState(
    initial.ano !== undefined ? String(initial.ano) : '',
  )
  const [cor, setCor] = useState(initial.cor ?? '')
  const [precoMin, setPrecoMin] = useState(initial.preco_min ?? '')
  const [precoMax, setPrecoMax] = useState(initial.preco_max ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({
      marca: marca.trim() || undefined,
      modelo: modelo.trim() || undefined,
      ano: parseAno(ano),
      cor: cor.trim() || undefined,
      preco_min: precoMin.trim() || undefined,
      preco_max: precoMax.trim() || undefined,
    })
  }

  function handleClear() {
    setMarca('')
    setModelo('')
    setAno('')
    setCor('')
    setPrecoMin('')
    setPrecoMax('')
    onClear()
  }

  return (
    <form className="vehicle-filters" onSubmit={handleSubmit}>
      <h2 className="vehicle-filters__title">Filtros</h2>
      <div className="vehicle-filters__grid">
        <div className="form-field">
          <label htmlFor="filter-marca">Marca</label>
          <input
            id="filter-marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filter-modelo">Modelo</label>
          <input
            id="filter-modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filter-ano">Ano</label>
          <input
            id="filter-ano"
            type="number"
            min={1900}
            inputMode="numeric"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filter-cor">Cor</label>
          <input
            id="filter-cor"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filter-preco-min">Preço mínimo (R$)</label>
          <input
            id="filter-preco-min"
            inputMode="decimal"
            value={precoMin}
            onChange={(e) => setPrecoMin(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filter-preco-max">Preço máximo (R$)</label>
          <input
            id="filter-preco-max"
            inputMode="decimal"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="vehicle-filters__actions">
        <button type="submit" className="btn-primary" disabled={disabled}>
          Aplicar filtros
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleClear}
          disabled={disabled}
        >
          Limpar
        </button>
      </div>
    </form>
  )
}
