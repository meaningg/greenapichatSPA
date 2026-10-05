import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEY } from '@/config/constants'
import { phoneToChatId } from '@/lib/phone'
import type { Chat, ConnectionStatus, Credentials, Message } from '@/api/types'

export interface IncomingMessagePayload {
  chatId: string
  phone: string
  title: string
  text: string
  timestamp: number
  idMessage?: string
}

export interface CreateChatInput {
  phone: string
  chatId?: string
  title?: string
}

interface SessionState {
  credentials: Credentials | null
  chats: Chat[]
  activeChatId: string | null
  connection: ConnectionStatus
  lastError: string | null

  setCredentials: (credentials: Credentials) => void
  logout: () => void
  setActiveChat: (chatId: string | null) => void
  createChat: (input: CreateChatInput) => string
  appendOutgoing: (chatId: string, message: Message) => void
  updateMessage: (chatId: string, id: string, patch: Partial<Message>) => void
  removeMessage: (chatId: string, id: string) => void
  receiveIncoming: (payload: IncomingMessagePayload) => void
  setConnection: (connection: ConnectionStatus) => void
  setLastError: (error: string | null) => void
}

function makeChat(input: { chatId: string; phone: string; title?: string }): Chat {
  return {
    chatId: input.chatId,
    phone: input.phone,
    title: input.title || input.phone,
    messages: [],
    unread: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function mapChat(chats: Chat[], chatId: string, updater: (chat: Chat) => Chat): Chat[] {
  return chats.map((chat) => (chat.chatId === chatId ? updater(chat) : chat))
}

/** Сообщения, не подтверждённые до перезагрузки, не могли быть отправлены — помечаем failed. */
function normalizeChat(chat: Chat): Chat {
  return {
    ...chat,
    messages: (chat.messages ?? []).map((message) =>
      message.status === 'sending'
        ? { ...message, status: 'failed' as const, error: 'Статус не подтверждён' }
        : message,
    ),
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      credentials: null,
      chats: [],
      activeChatId: null,
      connection: 'idle',
      lastError: null,

      setCredentials: (credentials) => set({ credentials, connection: 'polling' }),

      logout: () =>
        set({
          credentials: null,
          chats: [],
          activeChatId: null,
          connection: 'idle',
          lastError: null,
        }),

      setActiveChat: (activeChatId) =>
        set((state) => ({
          activeChatId,
          chats: activeChatId
            ? mapChat(state.chats, activeChatId, (chat) =>
                chat.unread ? { ...chat, unread: 0 } : chat,
              )
            : state.chats,
        })),

      createChat: ({ phone, chatId, title }) => {
        const resolvedChatId = chatId ?? phoneToChatId(phone)
        set((state) => {
          const exists = state.chats.some((chat) => chat.chatId === resolvedChatId)
          const chats = exists
            ? mapChat(state.chats, resolvedChatId, (chat) => ({ ...chat, unread: 0 }))
            : [...state.chats, makeChat({ chatId: resolvedChatId, phone, title })]
          return { chats, activeChatId: resolvedChatId }
        })
        return resolvedChatId
      },

      appendOutgoing: (chatId, message) =>
        set((state) => ({
          chats: mapChat(state.chats, chatId, (chat) => ({
            ...chat,
            messages: [...chat.messages, message],
            updatedAt: Date.now(),
          })),
        })),

      updateMessage: (chatId, id, patch) =>
        set((state) => ({
          chats: mapChat(state.chats, chatId, (chat) => ({
            ...chat,
            messages: chat.messages.map((message) =>
              message.id === id ? { ...message, ...patch } : message,
            ),
          })),
        })),

      removeMessage: (chatId, id) =>
        set((state) => ({
          chats: mapChat(state.chats, chatId, (chat) => ({
            ...chat,
            messages: chat.messages.filter((message) => message.id !== id),
          })),
        })),

      receiveIncoming: ({ chatId, phone, title, text, timestamp, idMessage }) =>
        set((state) => {
          // Входящий chatId может не совпадать с тем, на который отправляли,
          // поэтому дополнительно сопоставляем чат по номеру телефона.
          const existing =
            state.chats.find((chat) => chat.chatId === chatId) ??
            (phone ? state.chats.find((chat) => chat.phone === phone) : undefined)

          const targetChatId = existing?.chatId ?? chatId
          const isActive = state.activeChatId === targetChatId
          const chats = existing
            ? state.chats
            : [...state.chats, makeChat({ chatId, phone, title })]

          return {
            chats: mapChat(chats, targetChatId, (chat) => {
              if (idMessage && chat.messages.some((message) => message.serverId === idMessage)) {
                return chat
              }
              const message: Message = {
                id: `in-${idMessage ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
                serverId: idMessage,
                chatId: targetChatId,
                text,
                direction: 'in',
                timestamp,
                status: 'received',
              }
              const titleIsPhone = !chat.title || /^\+?\d/.test(chat.title)
              return {
                ...chat,
                title: title && titleIsPhone ? title : chat.title,
                messages: [...chat.messages, message],
                unread: isActive ? 0 : chat.unread + 1,
                updatedAt: Date.now(),
              }
            }),
          }
        }),

      setConnection: (connection) => set({ connection }),

      setLastError: (lastError) => set({ lastError }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        chats: state.chats,
        activeChatId: state.activeChatId,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<SessionState> | undefined
        if (!saved) return current
        return {
          ...current,
          credentials: saved.credentials ?? null,
          activeChatId: saved.activeChatId ?? null,
          chats: (saved.chats ?? []).map(normalizeChat),
        }
      },
    },
  ),
)
