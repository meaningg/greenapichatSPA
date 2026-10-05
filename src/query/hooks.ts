import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '@/api/greenApi'
import type { Credentials } from '@/api/types'
import { ACCOUNT_STATE_INTERVAL_MS } from '@/config/constants'
import { useSessionStore } from '@/store/sessionStore'
import { queryKeys } from './queryClient'

export function useValidateCredentials() {
  const setCredentials = useSessionStore((state) => state.setCredentials)

  return useMutation({
    mutationFn: (credentials: Credentials) => api.getStateInstance(credentials),
    onSuccess: (_data, credentials) => setCredentials(credentials),
  })
}

export interface SendMessageVariables {
  chatId: string
  text: string
}

export function useSendMessage() {
  const appendOutgoing = useSessionStore((state) => state.appendOutgoing)
  const updateMessage = useSessionStore((state) => state.updateMessage)

  return useMutation({
    mutationFn: async ({ chatId, text }: SendMessageVariables) => {
      const credentials = useSessionStore.getState().credentials
      if (!credentials) throw new Error('Нет подключения к GREEN-API')
      return api.sendMessage({ ...credentials, chatId, message: text })
    },
    onMutate: ({ chatId, text }) => {
      const localId = `out-${Date.now()}-${Math.random().toString(16).slice(2)}`
      appendOutgoing(chatId, {
        id: localId,
        chatId,
        text: text.trim(),
        direction: 'out',
        timestamp: Math.floor(Date.now() / 1000),
        status: 'sending',
      })
      return { localId }
    },
    onSuccess: (data, { chatId }, onMutateResult) => {
      if (!onMutateResult) return
      updateMessage(chatId, onMutateResult.localId, {
        status: 'sent',
        serverId: data.idMessage,
      })
    },
    onError: (error, { chatId }, onMutateResult) => {
      if (!onMutateResult) return
      updateMessage(chatId, onMutateResult.localId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    },
  })
}

export function useAccountState() {
  const credentials = useSessionStore((state) => state.credentials)
  const connection = useSessionStore((state) => state.connection)

  return useQuery({
    queryKey: queryKeys.accountState(credentials?.idInstance ?? 'none'),
    queryFn: () => api.getStateInstance(credentials as Credentials),
    enabled: Boolean(credentials) && connection !== 'offline',
    refetchInterval: ACCOUNT_STATE_INTERVAL_MS,
    staleTime: ACCOUNT_STATE_INTERVAL_MS,
  })
}
