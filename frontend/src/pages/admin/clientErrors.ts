import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Client not found': 'Cliente não encontrado.',
  'Access to this client record is not allowed':
    'Você não tem permissão para acessar este cliente.',
  'CPF or CNPJ is already registered':
    'Este CPF/CNPJ já está cadastrado para outro cliente.',
  'Invalid telephone format': 'Formato de telefone inválido.',
  'Invalid CPF or CNPJ': 'CPF ou CNPJ inválido.',
}

export function translateClientError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  return MESSAGES[err.detail] ?? err.detail
}