import type { TestDriveStatus } from '../../types/testDrive'

export type TestDriveResponseBody = {
  id: string
  cliente_id: string
  veiculo_id: string
  data_agendamento: string
  data_realizacao: string | null
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

export type TestDriveCreateBody = {
  veiculo_id: string
  data_agendamento: string
  observacoes?: string | null
}

export type TestDriveStatusUpdateBody = {
  status: TestDriveStatus
}

export type TestDriveUpdateBody = {
  data_agendamento: string
  observacoes?: string | null
}
