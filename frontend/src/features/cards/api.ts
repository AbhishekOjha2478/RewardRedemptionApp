import { api } from '../../api/client'
import type { CreditCard } from '../../types/models'

export interface AddCardPayload {
  cardNumber: string
  cardType?: string
  expiresOn: string
}

export async function fetchCards(customerId: number): Promise<CreditCard[]> {
  const response = await api.get<CreditCard[]>(`/customers/${customerId}/cards`)
  return response.data
}

export async function addCard(customerId: number, payload: AddCardPayload): Promise<CreditCard> {
  const response = await api.post<CreditCard>(`/customers/${customerId}/cards`, payload)
  return response.data
}
