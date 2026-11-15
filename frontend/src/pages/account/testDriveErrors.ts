import { ApiError } from '../../api/errors'

const MESSAGES: Record<string, string> = {
  'Authenticated client account is not linked to a customer record':
    'Sua conta não está vinculada a um cadastro de cliente.',
  'Vehicle is not eligible for test drive scheduling':
    'Este veículo não está elegível para test drive.',
  'A confirmed test drive already exists for this vehicle and time':
    'Já existe um test drive confirmado para este veículo no mesmo horário.',
  'Test drive status transition is not allowed':
    'Não é possível alterar o status deste agendamento.',
  'Final test drive appointments cannot be modified':
    'Agendamentos finalizados não podem ser alterados.',
  'Access to this test drive appointment is not allowed':
    'Você não tem acesso a este agendamento.',
  'Clients may only cancel their own test drive appointments':
    'Você só pode cancelar seus próprios agendamentos, alterando o status para cancelado.',
  'Insufficient permissions': 'Você não tem permissão para esta ação.',
}

export function translateTestDriveError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) {
    return fallback
  }
  if (err.status === 403) {
    return MESSAGES[err.detail] ?? 'Você não tem permissão para esta ação.'
  }
  return MESSAGES[err.detail] ?? err.detail
}
