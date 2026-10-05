import { API_URL } from '@/config/constants'
import type { Credentials, InstanceState } from './types'

/**
 * Клиент GREEN-API (Telegram). Формат запросов:
 *   {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
 *
 * Документация: https://green-api.com/telegram/docs/api/
 */

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

type CredentialsWithSignal = Credentials & { signal?: AbortSignal }

function instanceUrl(idInstance: string, method: string, apiTokenInstance: string): string {
  return `${API_URL}/waInstance${idInstance}/${method}/${apiTokenInstance}`
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const record = data as Record<string, unknown> | null
    const message =
      (record && typeof record.message === 'string' && record.message) ||
      (record && typeof record.error === 'string' && record.error) ||
      (typeof data === 'string' && data) ||
      `Ошибка запроса (HTTP ${res.status})`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

export async function getStateInstance({
  idInstance,
  apiTokenInstance,
  signal,
}: CredentialsWithSignal): Promise<{ stateInstance: InstanceState }> {
  const res = await fetch(instanceUrl(idInstance, 'getStateInstance', apiTokenInstance), { signal })
  return parseResponse<{ stateInstance: InstanceState }>(res)
}

export async function sendMessage({
  idInstance,
  apiTokenInstance,
  chatId,
  message,
  signal,
}: CredentialsWithSignal & { chatId: string; message: string }): Promise<{ idMessage: string }> {
  const res = await fetch(instanceUrl(idInstance, 'sendMessage', apiTokenInstance), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
    signal,
  })
  return parseResponse<{ idMessage: string }>(res)
}

export interface IncomingNotificationBody {
  typeWebhook: string
  timestamp: number
  idMessage?: string
  senderData?: {
    chatId?: string
    chatName?: string
    senderName?: string
    senderPhoneNumber?: number | string
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: { textMessage?: string }
  }
}

export interface ReceivedNotification {
  receiptId: number
  body: IncomingNotificationBody
}

/** Long-poll. Пустой ответ означает таймаут ожидания и не является ошибкой. */
export async function receiveNotification({
  idInstance,
  apiTokenInstance,
  receiveTimeout,
  signal,
}: CredentialsWithSignal & { receiveTimeout: number }): Promise<ReceivedNotification | null> {
  const url = `${instanceUrl(
    idInstance,
    'receiveNotification',
    apiTokenInstance,
  )}?receiveTimeout=${receiveTimeout}`
  const res = await fetch(url, { signal })

  if (!res.ok) {
    await parseResponse(res)
  }

  const text = await res.text()
  if (!text || !text.trim()) return null

  try {
    return JSON.parse(text) as ReceivedNotification
  } catch {
    return null
  }
}

export async function deleteNotification({
  idInstance,
  apiTokenInstance,
  receiptId,
  signal,
}: CredentialsWithSignal & { receiptId: number }): Promise<{ result: boolean; reason: string }> {
  const url = `${instanceUrl(
    idInstance,
    'deleteNotification',
    apiTokenInstance,
  )}/${encodeURIComponent(receiptId)}`
  const res = await fetch(url, { method: 'DELETE', signal })
  return parseResponse<{ result: boolean; reason: string }>(res)
}
