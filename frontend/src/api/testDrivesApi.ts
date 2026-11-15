import type { TestDrive, TestDriveStatus } from '../types/testDrive'
import { apiRequest } from './httpClient'
import type {
  TestDriveCreateBody,
  TestDriveResponseBody,
  TestDriveStatusUpdateBody,
} from './types/testDrive'

function mapTestDrive(dto: TestDriveResponseBody): TestDrive {
  return {
    id: dto.id,
    clienteId: dto.cliente_id,
    veiculoId: dto.veiculo_id,
    dataAgendamento: dto.data_agendamento,
    dataRealizacao: dto.data_realizacao,
    status: dto.status,
    observacoes: dto.observacoes,
    cliente: {
      id: dto.cliente.id,
      nome: dto.cliente.nome,
      email: dto.cliente.email,
    },
    veiculo: {
      id: dto.veiculo.id,
      marca: dto.veiculo.marca,
      modelo: dto.veiculo.modelo,
      ano: dto.veiculo.ano,
      status: dto.veiculo.status,
    },
  }
}

export type ListTestDrivesOptions = {
  status?: TestDriveStatus
  veiculoId?: string
  scheduledDate?: string
}

function buildListPath(options: ListTestDrivesOptions): string {
  const params = new URLSearchParams()
  if (options.status) {
    params.set('status', options.status)
  }
  if (options.veiculoId) {
    params.set('veiculo_id', options.veiculoId)
  }
  if (options.scheduledDate) {
    params.set('scheduled_date', options.scheduledDate)
  }
  const query = params.toString()
  return query ? `/api/test-drives?${query}` : '/api/test-drives'
}

export async function listTestDrives(
  token: string,
  options: ListTestDrivesOptions = {},
): Promise<TestDrive[]> {
  const data = await apiRequest<TestDriveResponseBody[]>(buildListPath(options), {
    token,
  })
  return data.map(mapTestDrive)
}

export async function scheduleTestDrive(
  payload: TestDriveCreateBody,
  token: string,
): Promise<TestDrive> {
  const data = await apiRequest<TestDriveResponseBody>('/api/test-drives', {
    method: 'POST',
    body: payload,
    token,
  })
  return mapTestDrive(data)
}

/** CLIENT: cancel own appointment (AGENDADO or CONFIRMADO) via PATCH status. */
export async function cancelTestDrive(
  testDriveId: string,
  token: string,
): Promise<TestDrive> {
  const body: TestDriveStatusUpdateBody = { status: 'CANCELADO' }
  const data = await apiRequest<TestDriveResponseBody>(
    `/api/test-drives/${testDriveId}/status`,
    {
      method: 'PATCH',
      body,
      token,
    },
  )
  return mapTestDrive(data)
}
