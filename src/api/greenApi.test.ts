import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '@/config/constants'
import {
  ApiError,
  deleteNotification,
  getStateInstance,
  receiveNotification,
  sendMessage,
} from './greenApi'

const fetchMock = vi.fn()

function mockResponse(
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response
}

const credentials = { idInstance: '1101', apiTokenInstance: 'token' }

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
})

describe('sendMessage', () => {
  it('делает POST на нужный URL и возвращает idMessage', async () => {
    fetchMock.mockResolvedValue(mockResponse({ idMessage: 'abc-123' }))

    const result = await sendMessage({
      ...credentials,
      chatId: '79991234567@c.us',
      message: 'Привет',
    })

    expect(result.idMessage).toBe('abc-123')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_URL}/waInstance1101/sendMessage/token`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      chatId: '79991234567@c.us',
      message: 'Привет',
    })
  })

  it('бросает ApiError с сообщением из тела ответа', async () => {
    fetchMock.mockResolvedValue(mockResponse({ message: 'Bad token' }, { ok: false, status: 401 }))

    const error = await sendMessage({
      ...credentials,
      chatId: '79991234567@c.us',
      message: 'Привет',
    }).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    expect((error as ApiError).message).toBe('Bad token')
  })
})

describe('receiveNotification', () => {
  it('возвращает null на пустой ответ (таймаут long-poll)', async () => {
    fetchMock.mockResolvedValue(mockResponse(''))

    const result = await receiveNotification({ ...credentials, receiveTimeout: 10 })

    expect(result).toBeNull()
  })

  it('возвращает разобранное уведомление', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ receiptId: 7, body: { typeWebhook: 'incomingMessageReceived' } }),
    )

    const result = await receiveNotification({ ...credentials, receiveTimeout: 10 })

    expect(result?.receiptId).toBe(7)
    expect(result?.body.typeWebhook).toBe('incomingMessageReceived')
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe(`${API_URL}/waInstance1101/receiveNotification/token?receiveTimeout=10`)
  })

  it('бросает ApiError при ответе с ошибкой', async () => {
    fetchMock.mockResolvedValue(mockResponse({ error: 'not found' }, { ok: false, status: 404 }))

    await expect(receiveNotification({ ...credentials, receiveTimeout: 10 })).rejects.toThrow(
      'not found',
    )
  })
})

describe('deleteNotification', () => {
  it('подставляет receiptId в URL', async () => {
    fetchMock.mockResolvedValue(mockResponse({ result: true, reason: '' }))

    const result = await deleteNotification({ ...credentials, receiptId: 123 })

    expect(result.result).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_URL}/waInstance1101/deleteNotification/token/123`)
    expect(init.method).toBe('DELETE')
  })
})

describe('getStateInstance', () => {
  it('возвращает состояние инстанса', async () => {
    fetchMock.mockResolvedValue(mockResponse({ stateInstance: 'authorized' }))

    const result = await getStateInstance(credentials)

    expect(result.stateInstance).toBe('authorized')
  })
})
