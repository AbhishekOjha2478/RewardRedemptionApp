import { api } from '../../api/client'
import type { Transaction } from '../../types/models'
import type { Page } from '../../types/api'

export async function fetchTransactions(
  cardId: number,
  page: number,
  size: number,
): Promise<Page<Transaction>> {
  const response = await api.get<Page<Transaction>>(`/cards/${cardId}/transactions`, {
    params: { page, size },
  })
  return response.data
}

export async function generateTransactions(cardId: number): Promise<Transaction[]> {
  const response = await api.post<Transaction[]>(`/cards/${cardId}/transactions/generate`)
  return response.data
}
