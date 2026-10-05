import { useEffect } from 'react'
import * as api from '@/api/greenApi'
import { ApiError, type IncomingNotificationBody } from '@/api/greenApi'
import { normalizePhone } from '@/lib/phone'
import {
  MIN_RECEIVE_INTERVAL_MS,
  RATE_LIMIT_BACKOFF_MS,
  RECEIVE_BACKOFF_BASE_MS,
  RECEIVE_BACKOFF_MAX_MS,
  RECEIVE_TIMEOUT_SECONDS,
} from '@/config/constants'
import { useSessionStore, type IncomingMessagePayload } from '@/store/sessionStore'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

function toIncomingPayload(body: IncomingNotificationBody): IncomingMessagePayload | null {
  if (body.typeWebhook !== 'incomingMessageReceived') return null

  const messageData = body.messageData
  if (!messageData || messageData.typeMessage !== 'textMessage') return null

  const text = messageData.textMessageData?.textMessage
  const chatId = body.senderData?.chatId
  if (!text || !chatId) return null

  const sender = body.senderData ?? {}
  return {
    chatId,
    phone: normalizePhone(String(sender.senderPhoneNumber ?? '')),
    title: sender.senderName || sender.chatName || '',
    text,
    timestamp: body.timestamp,
    idMessage: body.idMessage,
  }
}

/**
 * Long-poll цикл: ReceiveNotification → обработка → DeleteNotification → повтор.
 * Не реализован через refetchInterval, т.к. тот не ждёт завершения запроса.
 */
export function useReceiveLoop(enabled: boolean): void {
  const credentials = useSessionStore((state) => state.credentials)

  useEffect(() => {
    if (credentials && !enabled) {
      useSessionStore.getState().setConnection('idle')
    }
  }, [credentials, enabled])

  useEffect(() => {
    if (!credentials || !enabled) return undefined

    const { receiveIncoming, setConnection, setLastError } = useSessionStore.getState()
    let cancelled = false
    const controller = new AbortController()
    let backoff = RECEIVE_BACKOFF_BASE_MS

    async function loop(): Promise<void> {
      setConnection('polling')
      while (!cancelled) {
        const startedAt = Date.now()
        try {
          const notification = await api.receiveNotification({
            ...credentials!,
            receiveTimeout: RECEIVE_TIMEOUT_SECONDS,
            signal: controller.signal,
          })
          if (cancelled) break

          backoff = RECEIVE_BACKOFF_BASE_MS
          setConnection('online')
          setLastError(null)

          if (notification?.body) {
            const payload = toIncomingPayload(notification.body)
            if (payload) receiveIncoming(payload)

            try {
              await api.deleteNotification({
                ...credentials!,
                receiptId: notification.receiptId,
                signal: controller.signal,
              })
            } catch (error) {
              if (cancelled || isAbortError(error)) break
              // Уведомление не удалилось — продолжаем опрос, чтобы не зациклиться.
              console.warn('DeleteNotification failed:', error)
            }
          }
        } catch (error) {
          if (cancelled || isAbortError(error)) break

          const isRateLimited = error instanceof ApiError && error.status === 429
          if (isRateLimited) {
            backoff = Math.max(backoff, RATE_LIMIT_BACKOFF_MS)
          }
          setConnection('offline')
          setLastError(
            isRateLimited
              ? 'Превышен лимит запросов к GREEN-API (429). Приём приостановлен, повтор через несколько секунд.'
              : error instanceof Error
                ? error.message
                : String(error),
          )
          await delay(backoff, controller.signal)
          backoff = Math.min(backoff * 2, RECEIVE_BACKOFF_MAX_MS)
          continue
        }

        const elapsed = Date.now() - startedAt
        if (!cancelled && elapsed < MIN_RECEIVE_INTERVAL_MS) {
          await delay(MIN_RECEIVE_INTERVAL_MS - elapsed, controller.signal)
        }
      }
    }

    void loop()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [credentials, enabled])
}
