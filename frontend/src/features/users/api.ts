import { api } from '../../api/client'
import type { CesUser } from '../../types/models'

export interface CreateCesUserPayload {
  username: string
  password: string
  fullName: string
  email: string
}

export async function fetchCesUsers(): Promise<CesUser[]> {
  const response = await api.get<CesUser[]>('/ces-users')
  return response.data
}

export async function createCesUser(payload: CreateCesUserPayload): Promise<CesUser> {
  const response = await api.post<CesUser>('/ces-users', payload)
  return response.data
}

export async function deleteCesUser(id: number): Promise<void> {
  await api.delete(`/ces-users/${id}`)
}
