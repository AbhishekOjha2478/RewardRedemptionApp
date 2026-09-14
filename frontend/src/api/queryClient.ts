import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

function isClientError(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status >= 400 && error.response.status < 500
  }
  return false
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => failureCount < 1 && !isClientError(error),
    },
  },
})
