import { api, SLOW_REQUEST_CONFIG } from '../../api/client'
import type { LoginResponse } from '../../types/models'

export interface LoginCredentials {
  username: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', credentials, SLOW_REQUEST_CONFIG)
  return response.data
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.post('/auth/change-password', payload)
}
