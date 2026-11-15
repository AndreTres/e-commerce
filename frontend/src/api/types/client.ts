export type ClientResponseBody = {
  id: string
  nome: string
  cpf_cnpj: string
  email: string
  telefone: string
  endereco: string
  data_cadastro: string
}

export type ClientUpdateBody = {
  nome: string
  cpf_cnpj: string
  email: string
  telefone: string
  endereco: string
}
