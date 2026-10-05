import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/api/greenApi'
import { ApiError } from '@/api/greenApi'
import {
  MIN_RECEIVE_INTERVAL_MS,
  RATE_LIMIT_BACKOFF_MS,
  RECEIVE_BACKOFF_BASE_MS,
} from '@/config/constants'
import { useSessionStore } from '@/store/sessionStore'
import { useReceiveLoop } from './useReceiveLoop'

vi.mock('@/api/greenApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/greenApi')>()
  return {
    ...actual,
    receiveNotification: vi.fn(),
    deleteNotification: vi.fn(),
  }
})

const receiveNotification = vi.mocked(api.receiveNotification)
const deleteNotification = vi.mocked(api.deleteNotification)

/** Промис, который никогда не резолвится: «паркует» цикл после ожидаемой итерации. */
function pending(): Promise<never> {
  return new Promise<never>(() => {})
}

function notification(
  receiptId: number,
  body: Partial<api.IncomingNotificationBody> = {},
): api.ReceivedNotification {
  return {
    receiptId,
    body: {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1_700_000_000,
      idMessage: 'm1',
      senderData: {
        chatId: '1234567890',
        senderPhoneNumber: 7_999_123_45_67,
        senderName: 'Иван',
      },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
      ...body,
    },
  }
}

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  useSessionStore.setState({
    credentials: { idInstance: '1101', apiTokenInstance: 'token' },
    chats: [],
    activeChatId: null,
    connection: 'idle',
    lastError: null,
  })
  receiveNotification.mockReset()
  deleteNotification.mockReset()
  receiveNotification.mockResolvedValue(null)
  deleteNotification.mockResolvedValue({ result: true, reason: '' })
})

afterEach(() => {
  vi.useRealTimers()
  useSessionStore.setState({
    credentials: null,
    chats: [],
    activeChatId: null,
    connection: 'idle',
    lastError: null,
  })
})

describe('useReceiveLoop', () => {
  it('обрабатывает входящее текстовое сообщение и подтверждает его', async () => {
    receiveNotification.mockResolvedValueOnce(notification(1)).mockReturnValue(pending())

    renderHook(() => useReceiveLoop(true))
    await flush()

    expect(deleteNotification).toHaveBeenCalledWith(expect.objectContaining({ receiptId: 1 }))

    const state = useSessionStore.getState()
    expect(state.connection).toBe('online')
    expect(state.lastError).toBeNull()
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0].chatId).toBe('1234567890')
    expect(state.chats[0].messages[0]).toMatchObject({ text: 'Привет', direction: 'in' })
  })

  it('игнорирует не-текстовые уведомления, но всё равно подтверждает их', async () => {
    receiveNotification
      .mockResolvedValueOnce(
        notification(2, {
          messageData: { typeMessage: 'imageMessage' },
        }),
      )
      .mockReturnValue(pending())

    renderHook(() => useReceiveLoop(true))
    await flush()

    expect(useSessionStore.getState().chats).toHaveLength(0)
    expect(deleteNotification).toHaveBeenCalledWith(expect.objectContaining({ receiptId: 2 }))
  })

  it('пустой ответ long-poll не считается ошибкой', async () => {
    renderHook(() => useReceiveLoop(true))
    await flush()

    expect(receiveNotification).toHaveBeenCalled()
    expect(deleteNotification).not.toHaveBeenCalled()
    expect(useSessionStore.getState().connection).toBe('online')
    expect(useSessionStore.getState().lastError).toBeNull()
  })

  it('при 429 уходит в offline и повторяет после длинной паузы', async () => {
    receiveNotification
      .mockRejectedValueOnce(new ApiError('rate limited', 429, null))
      .mockResolvedValue(null)

    renderHook(() => useReceiveLoop(true))
    await flush()

    expect(useSessionStore.getState().connection).toBe('offline')
    expect(useSessionStore.getState().lastError).toContain('429')

    const callsAfterError = receiveNotification.mock.calls.length
    await flush(RATE_LIMIT_BACKOFF_MS)

    expect(receiveNotification.mock.calls.length).toBeGreaterThan(callsAfterError)
    expect(useSessionStore.getState().connection).toBe('online')
    expect(useSessionStore.getState().lastError).toBeNull()
  })

  it('увеличивает паузу между повторами при ошибках (exponential backoff)', async () => {
    receiveNotification.mockRejectedValue(new ApiError('boom', 500, null))

    renderHook(() => useReceiveLoop(true))
    await flush()

    expect(receiveNotification).toHaveBeenCalledTimes(1)

    // первая ошибка → пауза RECEIVE_BACKOFF_BASE_MS
    await flush(RECEIVE_BACKOFF_BASE_MS)
    expect(receiveNotification).toHaveBeenCalledTimes(2)

    // вторая ошибка → пауза удвоена: за один базовый интервал повтора быть не должно
    await flush(RECEIVE_BACKOFF_BASE_MS)
    expect(receiveNotification).toHaveBeenCalledTimes(2)

    await flush(RECEIVE_BACKOFF_BASE_MS)
    expect(receiveNotification).toHaveBeenCalledTimes(3)
  })

  it('не запускает опрос, когда enabled=false', async () => {
    renderHook(() => useReceiveLoop(false))
    await flush(MIN_RECEIVE_INTERVAL_MS)

    expect(receiveNotification).not.toHaveBeenCalled()
    expect(useSessionStore.getState().connection).toBe('idle')
  })

  it('останавливает опрос и возвращает статус idle при выключении', async () => {
    const { rerender } = renderHook(({ enabled }) => useReceiveLoop(enabled), {
      initialProps: { enabled: true },
    })
    await flush()
    expect(useSessionStore.getState().connection).toBe('online')

    const callsWhileActive = receiveNotification.mock.calls.length

    rerender({ enabled: false })
    await flush(MIN_RECEIVE_INTERVAL_MS * 5)

    expect(useSessionStore.getState().connection).toBe('idle')
    expect(receiveNotification.mock.calls.length).toBe(callsWhileActive)
  })
})
