import { ChevronLeft, MessagesSquare } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, EmptyState, IconButton, StatusDot } from '@/ui'
import type { InstanceState, Message } from '@/api/types'
import { initials } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { useAccountState, useSendMessage } from '@/query/hooks'
import { useSessionStore } from '@/store/sessionStore'
import { Composer } from './Composer'
import { ConnectionBanner } from './ConnectionBanner'
import { AccountNotice } from './AccountNotice'
import { MessageList } from './MessageList'

const ACCOUNT_LABEL: Record<InstanceState, string> = {
  authorized: 'Авторизован',
  starting: 'Запуск…',
  notAuthorized: 'Не авторизован',
  blocked: 'Заблокирован',
  unknown: 'Неизвестно',
}

export function ChatWindow() {
  const chat = useSessionStore(
    (state) =>
      (state.activeChatId
        ? state.chats.find((item) => item.chatId === state.activeChatId)
        : undefined) ?? null,
  )
  const connection = useSessionStore((state) => state.connection)
  const setActiveChat = useSessionStore((state) => state.setActiveChat)
  const removeMessage = useSessionStore((state) => state.removeMessage)

  const { mutateAsync } = useSendMessage()
  const account = useAccountState()

  const chatId = chat?.chatId ?? null

  const send = useCallback(
    (text: string) => {
      if (!chatId) return
      mutateAsync({ chatId, text }).catch((error: unknown) => {
        toast.error('Не удалось отправить сообщение', {
          description: error instanceof Error ? error.message : undefined,
        })
      })
    },
    [chatId, mutateAsync],
  )

  const retry = useCallback(
    (message: Message) => {
      if (!chatId) return
      removeMessage(chatId, message.id)
      send(message.text)
    },
    [chatId, removeMessage, send],
  )

  if (!chat) {
    return (
      <section className="chat-canvas flex min-w-0 flex-1 items-center justify-center">
        <EmptyState
          icon={MessagesSquare}
          title="Выберите чат"
          description="или создайте новый, чтобы начать переписку в Telegram через GREEN-API."
        />
      </section>
    )
  }

  return (
    <section className="chat-canvas flex min-w-0 flex-1 flex-col">
      <header className="border-b border-line bg-surface px-4 py-2.5">
        <div className="chat-column flex items-center gap-3">
          <IconButton
            size="icon-sm"
            className="md:hidden"
            onClick={() => setActiveChat(null)}
            aria-label="К списку чатов"
          >
            <ChevronLeft className="size-4" />
          </IconButton>

          <Avatar>
            <AvatarFallback>{initials(chat.title)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{chat.title}</p>
            <p className="truncate text-xs text-muted">{formatPhone(chat.phone) || chat.chatId}</p>
          </div>

          <div className="hidden flex-col items-end gap-1 sm:flex">
            <StatusDot status={connection} />
            {account.data && (
              <span className="text-[11px] text-muted">
                {ACCOUNT_LABEL[account.data.stateInstance] ?? account.data.stateInstance}
              </span>
            )}
          </div>
        </div>
      </header>

      <ConnectionBanner />
      {account.data && account.data.stateInstance !== 'authorized' && (
        <AccountNotice state={account.data.stateInstance} />
      )}
      <MessageList chat={chat} onRetry={retry} />
      <Composer disabled={connection === 'offline'} onSend={send} />
    </section>
  )
}
