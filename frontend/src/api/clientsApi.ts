import type { ClientProfile } from '../types/client'
import { apiRequest } from './httpClient'
import type { ClientResponseBody, ClientUpdateBody } from './types/client'

function mapClient(dto: ClientResponseBody): ClientProfile {
  return {
    id: dto.id,
    nome: dto.nome,
    cpfCnpj: dto.cpf_cnpj,
    email: dto.email,
    telefone: dto.telefone,
    endereco: dto.endereco,
    dataCadastro: dto.data_cadastro,
  }
}

export async function listClients(
  token: string,
  search?: string,
): Promise<ClientProfile[]> {
  const path = search?.trim()
    ? `/api/clients?search=${encodeURIComponent(search.trim())}`
    : '/api/clients'
  const data = await apiRequest<ClientResponseBody[]>(path, { token })
  return data.map(mapClient)
}

export async function getClient(
  clientId: string,
  token: string,
): Promise<ClientProfile> {
  const data = await apiRequest<ClientResponseBody>(`/api/clients/${clientId}`, {
    token,
  })
  return mapClient(data)
}

export async function updateClient(
  clientId: string,
  payload: ClientUpdateBody,
  token: string,
): Promise<ClientProfile> {
  const data = await apiRequest<ClientResponseBody>(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: payload,
    token,
  })
  return mapClient(data)
}
