import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/greenApi'

function shouldRetry(failureCount: number, error: unknown, maxRetries: number): boolean {
  // 4xx (включая 429) повторять бессмысленно и вредно — только усиливает лимит.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < maxRetries
}

/**
 * Поток входящих сообщений намеренно не реализован через refetchInterval:
 * он планируется фиксированным таймером, не ждёт завершения запроса и ломает
 * long-poll. Приём живёт в useReceiveLoop, здесь — только request/response.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => shouldRetry(failureCount, error, 1),
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
    mutations: {
      retry: (failureCount, error) => shouldRetry(failureCount, error, 1),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
})

export const queryKeys = {
  accountState: (idInstance: string) => ['accountState', idInstance] as const,
}
