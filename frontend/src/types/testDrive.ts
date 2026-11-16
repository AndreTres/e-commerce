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

/** Espelha `FINAL_TEST_DRIVE_STATUSES` do backend (`app/core/test_drive_status.py`). */
export const FINAL_TEST_DRIVE_STATUSES: readonly TestDriveStatus[] = [
  'REALIZADO',
  'CANCELADO',
  'NAO_COMPARECEU',
]

export function isFinalTestDriveStatus(status: TestDriveStatus): boolean {
  return (FINAL_TEST_DRIVE_STATUSES as readonly string[]).includes(status)
}

/** Espelha `ALLOWED_TEST_DRIVE_TRANSITIONS` do backend. */
export const ALLOWED_TEST_DRIVE_TRANSITIONS: Record<
  TestDriveStatus,
  readonly TestDriveStatus[]
> = {
  AGENDADO: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['REALIZADO', 'CANCELADO', 'NAO_COMPARECEU'],
  REALIZADO: [],
  CANCELADO: [],
  NAO_COMPARECEU: [],
}

export function getAllowedTestDriveTransitions(
  from: TestDriveStatus,
): TestDriveStatus[] {
  return [...ALLOWED_TEST_DRIVE_TRANSITIONS[from]]
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
