import { beforeEach, describe, expect, it } from 'vitest'
import type { Message } from '@/api/types'
import { useSessionStore } from './sessionStore'

function resetStore() {
  useSessionStore.setState({
    credentials: null,
    chats: [],
    activeChatId: null,
    connection: 'idle',
    lastError: null,
  })
}

beforeEach(resetStore)

describe('createChat', () => {
  it('создаёт чат по номеру и делает его активным', () => {
    const chatId = useSessionStore.getState().createChat({ phone: '79991234567' })
    const state = useSessionStore.getState()

    expect(chatId).toBe('79991234567@c.us')
    expect(state.activeChatId).toBe('79991234567@c.us')
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0]).toMatchObject({
      chatId: '79991234567@c.us',
      phone: '79991234567',
      title: '79991234567',
    })
  })

  it('не создаёт дубликат при повторном вызове', () => {
    useSessionStore.getState().createChat({ phone: '79991234567' })
    useSessionStore.getState().createChat({ phone: '79991234567' })

    expect(useSessionStore.getState().chats).toHaveLength(1)
  })
})

describe('receiveIncoming', () => {
  it('кладывает входящее в существующий чат, сопоставляя по номеру (Telegram chatId отличается)', () => {
    useSessionStore.getState().createChat({ phone: '79991234567' })

    useSessionStore.getState().receiveIncoming({
      chatId: '1234567890',
      phone: '79991234567',
      title: 'Иван',
      text: 'Привет',
      timestamp: 1_700_000_000,
      idMessage: 'in-1',
    })

    const state = useSessionStore.getState()
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0].chatId).toBe('79991234567@c.us')
    expect(state.chats[0].messages).toHaveLength(1)
    expect(state.chats[0].messages[0]).toMatchObject({
      text: 'Привет',
      direction: 'in',
      status: 'received',
    })
  })

  it('создаёт новый чат, если совпадений нет', () => {
    useSessionStore.getState().receiveIncoming({
      chatId: '1234567890',
      phone: '79990000000',
      title: 'Новый',
      text: 'Здравствуйте',
      timestamp: 1_700_000_000,
    })

    const state = useSessionStore.getState()
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0].chatId).toBe('1234567890')
  })

  it('не дублирует входящее по idMessage', () => {
    const payload = {
      chatId: '1234567890',
      phone: '79990000000',
      title: 'Новый',
      text: 'Дубликат',
      timestamp: 1_700_000_000,
      idMessage: 'dup-1',
    }
    useSessionStore.getState().receiveIncoming(payload)
    useSessionStore.getState().receiveIncoming(payload)

    expect(useSessionStore.getState().chats[0].messages).toHaveLength(1)
  })

  it('увеличивает счётчик непрочитанных только для неактивного чата', () => {
    const { createChat, setActiveChat, receiveIncoming } = useSessionStore.getState()
    createChat({ phone: '79990000001' })
    createChat({ phone: '79990000002' })
    setActiveChat('79990000001@c.us')

    receiveIncoming({
      chatId: '79990000002@c.us',
      phone: '79990000002',
      title: 'Второй',
      text: 'Есть кто?',
      timestamp: 1_700_000_000,
    })

    const second = useSessionStore
      .getState()
      .chats.find((chat) => chat.chatId === '79990000002@c.us')
    expect(second?.unread).toBe(1)
  })
})

describe('setActiveChat', () => {
  it('сбрасывает счётчик непрочитанных при открытии чата', () => {
    const { createChat, setActiveChat, receiveIncoming } = useSessionStore.getState()
    createChat({ phone: '79990000001' })
    createChat({ phone: '79990000002' })
    setActiveChat('79990000001@c.us')
    receiveIncoming({
      chatId: '79990000002@c.us',
      phone: '79990000002',
      title: 'Второй',
      text: 'Есть кто?',
      timestamp: 1_700_000_000,
    })

    setActiveChat('79990000002@c.us')

    const second = useSessionStore
      .getState()
      .chats.find((chat) => chat.chatId === '79990000002@c.us')
    expect(second?.unread).toBe(0)
  })
})

describe('работа с исходящими сообщениями', () => {
  const outgoing: Message = {
    id: 'out-1',
    chatId: '79991234567@c.us',
    text: 'Привет',
    direction: 'out',
    timestamp: 1_700_000_000,
    status: 'sending',
  }

  it('добавляет, обновляет и удаляет сообщение', () => {
    useSessionStore.getState().createChat({ phone: '79991234567' })
    const chatId = '79991234567@c.us'

    useSessionStore.getState().appendOutgoing(chatId, outgoing)
    expect(useSessionStore.getState().chats[0].messages).toHaveLength(1)

    useSessionStore.getState().updateMessage(chatId, 'out-1', { status: 'sent', serverId: 'srv-1' })
    expect(useSessionStore.getState().chats[0].messages[0]).toMatchObject({
      status: 'sent',
      serverId: 'srv-1',
    })

    useSessionStore.getState().removeMessage(chatId, 'out-1')
    expect(useSessionStore.getState().chats[0].messages).toHaveLength(0)
  })
})

describe('logout', () => {
  it('очищает сессию и чаты', () => {
    useSessionStore.getState().setCredentials({ idInstance: '1101', apiTokenInstance: 'token' })
    useSessionStore.getState().createChat({ phone: '79991234567' })

    useSessionStore.getState().logout()

    const state = useSessionStore.getState()
    expect(state.credentials).toBeNull()
    expect(state.chats).toHaveLength(0)
    expect(state.activeChatId).toBeNull()
    expect(state.connection).toBe('idle')
  })
})
