import { api } from '../../api/client'
import type { RewardCategory, RewardProcessingResult, RewardSummary } from '../../types/models'

export async function fetchRewardSummary(customerId: number): Promise<RewardSummary> {
  const response = await api.get<RewardSummary>(`/customers/${customerId}/rewards/summary`)
  return response.data
}

export async function processRewards(customerId: number): Promise<RewardProcessingResult> {
  const response = await api.post<RewardProcessingResult>(`/customers/${customerId}/rewards/process`)
  return response.data
}

export async function fetchCatalog(): Promise<RewardCategory[]> {
  const response = await api.get<RewardCategory[]>('/rewards/catalog')
  return response.data
}
