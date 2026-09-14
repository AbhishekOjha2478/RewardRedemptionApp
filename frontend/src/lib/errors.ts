import axios from 'axios'
import type { ApiError } from '../types/api'

export function getApiError(error: unknown): ApiError | null {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>
    if (typeof data.status === 'number' && typeof data.message === 'string') {
      return data as ApiError
    }
  }
  return null
}

export function getFieldErrors(error: unknown): Record<string, string> {
  return getApiError(error)?.fieldErrors ?? {}
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. It may still be starting up.'
    }
    if (!error.response) {
      return 'Cannot reach the server. It may still be starting up, please try again in a moment.'
    }
    const status = error.response.status
    if (status === 502 || status === 503 || status === 504) {
      return 'The server is starting up. Please try again in a moment.'
    }
    const apiError = getApiError(error)
    if (apiError) {
      return apiError.message
    }
    return `Request failed with status ${status}.`
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong.'
}
