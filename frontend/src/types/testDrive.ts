export const TEST_DRIVE_STATUSES = [
  'AGENDADO',
  'CONFIRMADO',
  'REALIZADO',
  'CANCELADO',
  'NAO_COMPARECEU',
] as const

export type TestDriveStatus = (typeof TEST_DRIVE_STATUSES)[number]

export const TEST_DRIVE_STATUS_LABELS: Record<TestDriveStatus, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não compareceu',
}

export type TestDrive = {
  id: string
  clienteId: string
  veiculoId: string
  dataAgendamento: string
  dataRealizacao: string | null
  status: TestDriveStatus
  observacoes: string | null
  cliente: {
    id: string
    nome: string
    email: string
  }
  veiculo: {
    id: string
    marca: string
    modelo: string
    ano: number
    status: string
  }
}
