import { api } from '../../api/client'
import type { Cart, Redemption } from '../../types/models'
import type { Page } from '../../types/api'

export async function fetchCart(customerId: number): Promise<Cart> {
  const response = await api.get<Cart>(`/customers/${customerId}/cart`)
  return response.data
}

export async function addToCart(
  customerId: number,
  rewardItemId: number,
  quantity: number,
): Promise<Cart> {
  const response = await api.post<Cart>(`/customers/${customerId}/cart/items`, {
    rewardItemId,
    quantity,
  })
  return response.data
}

export async function updateCartQuantity(
  customerId: number,
  cartItemId: number,
  quantity: number,
): Promise<Cart> {
  const response = await api.patch<Cart>(`/customers/${customerId}/cart/items/${cartItemId}`, {
    quantity,
  })
  return response.data
}

export async function removeCartItem(customerId: number, cartItemId: number): Promise<Cart> {
  const response = await api.delete<Cart>(`/customers/${customerId}/cart/items/${cartItemId}`)
  return response.data
}

export async function clearCart(customerId: number): Promise<Cart> {
  const response = await api.delete<Cart>(`/customers/${customerId}/cart`)
  return response.data
}

export async function redeemCart(customerId: number): Promise<Redemption> {
  const response = await api.post<Redemption>(`/customers/${customerId}/redemptions`)
  return response.data
}

export async function fetchRedemptions(
  customerId: number,
  page = 0,
  size = 10,
): Promise<Page<Redemption>> {
  const response = await api.get<Page<Redemption>>(`/customers/${customerId}/redemptions`, {
    params: { page, size },
  })
  return response.data
}
