export type LoginRequestBody = {
  email: string
  password: string
}

export type TokenResponseBody = {
  access_token: string
  token_type: string
}

export type CurrentUserResponseBody = {
  id: string
  email: string
  role: string
}
