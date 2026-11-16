type VehicleFormFieldsProps = {
  marca: string
  modelo: string
  ano: string
  cor: string
  quilometragem: string
  preco: string
  descricao: string
  disabled?: boolean
  onMarcaChange: (value: string) => void
  onModeloChange: (value: string) => void
  onAnoChange: (value: string) => void
  onCorChange: (value: string) => void
  onQuilometragemChange: (value: string) => void
  onPrecoChange: (value: string) => void
  onDescricaoChange: (value: string) => void
}

export function VehicleFormFields({
  marca,
  modelo,
  ano,
  cor,
  quilometragem,
  preco,
  descricao,
  disabled,
  onMarcaChange,
  onModeloChange,
  onAnoChange,
  onCorChange,
  onQuilometragemChange,
  onPrecoChange,
  onDescricaoChange,
}: VehicleFormFieldsProps) {
  return (
  <div className="vehicle-admin-form__grid">
    <Input label="Marca" id="vehicle-marca" value={marca} onChange={onMarcaChange} disabled={disabled} required />
    <Input label="Modelo" id="vehicle-modelo" value={modelo} onChange={onModeloChange} disabled={disabled} required />
    <Input label="Ano" id="vehicle-ano" type="number" min={1900} value={ano} onChange={onAnoChange} disabled={disabled} required />
    <Input label="Cor" id="vehicle-cor" value={cor} onChange={onCorChange} disabled={disabled} required />
    <Input label="Quilometragem (km)" id="vehicle-km" type="number" min={0} value={quilometragem} onChange={onQuilometragemChange} disabled={disabled} required />
    <Input label="Preço (R$)" id="vehicle-preco" inputMode="decimal" value={preco} onChange={onPrecoChange} disabled={disabled} required />
    <div className="form-field">
      <label htmlFor="vehicle-descricao">Descrição</label>
      <textarea
        id="vehicle-descricao"
        rows={4}
        maxLength={2000}
        value={descricao}
        onChange={(e) => onDescricaoChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  </div>
  )
}

function Input({
  label,
  id,
  type = 'text',
  min,
  inputMode,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string
  id: string
  type?: string
  min?: number
  inputMode?: 'decimal' | 'numeric' | 'text'
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        min={min}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
      />
    </div>
  )
}