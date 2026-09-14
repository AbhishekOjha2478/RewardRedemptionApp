import { api } from '../../api/client'
import type { Customer } from '../../types/models'
import type { Page } from '../../types/api'

export interface CustomerQuery {
  q: string
  page: number
  size: number
}

export interface CreateCustomerPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  associatedSince: string
}

export async function fetchCustomers(query: CustomerQuery): Promise<Page<Customer>> {
  const response = await api.get<Page<Customer>>('/customers', {
    params: { q: query.q || undefined, page: query.page, size: query.size },
  })
  return response.data
}

export async function fetchCustomer(customerId: number): Promise<Customer> {
  const response = await api.get<Customer>(`/customers/${customerId}`)
  return response.data
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const response = await api.post<Customer>('/customers', payload)
  return response.data
}

export async function deleteCustomer(customerId: number): Promise<void> {
  await api.delete(`/customers/${customerId}`)
}
