import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import type { LoginResponse } from '../types/models'
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from '../auth/tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set. Check the environment file for this build.')
}

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

const bare = axios.create({ baseURL, timeout: 90000 })

export const SLOW_REQUEST_CONFIG: AxiosRequestConfig = { timeout: 90000 }

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

let refreshInFlight: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token stored'))
    }

    refreshInFlight = bare
      .post<LoginResponse>('/auth/refresh', { refreshToken })
      .then((response) => {
        saveTokens(response.data.accessToken, response.data.refreshToken)
        return response.data.accessToken
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  if (url.startsWith('/auth/login') || url.startsWith('/auth/refresh')) {
    return config
  }
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ''

    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/refresh')

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      try {
        const newToken = await refreshAccessToken()
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
        return api.request(original)
      } catch {
        clearSession()
        if (unauthorizedHandler) {
          unauthorizedHandler()
        }
      }
    }

    return Promise.reject(error)
  },
)
