export type MessageDirection = 'in' | 'out'

/** sending — оптимистично добавлено, sent — подтверждено API, failed — ошибка, received — входящее. */
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'received'

export interface Message {
  id: string
  serverId?: string
  chatId: string
  text: string
  direction: MessageDirection
  timestamp: number
  status: MessageStatus
  error?: string
}

export interface Chat {
  chatId: string
  phone: string
  title: string
  messages: Message[]
  unread: number
  createdAt: number
  updatedAt: number
}

export interface Credentials {
  idInstance: string
  apiTokenInstance: string
}

export type ConnectionStatus = 'idle' | 'polling' | 'online' | 'offline'

export type InstanceState = 'authorized' | 'starting' | 'notAuthorized' | 'blocked' | 'unknown'
