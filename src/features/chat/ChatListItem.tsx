import { Avatar, AvatarFallback } from '@/ui'
import type { Chat } from '@/api/types'
import { formatTime, initials, previewText } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ChatListItemProps {
  chat: Chat
  active: boolean
  onSelect: (chatId: string) => void
}

export function ChatListItem({ chat, active, onSelect }: ChatListItemProps) {
  const last = chat.messages[chat.messages.length - 1]

  return (
    <button
      type="button"
      onClick={() => onSelect(chat.chatId)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors',
        active ? 'bg-accent-soft' : 'hover:bg-surface-2',
      )}
    >
      <Avatar className="size-11">
        <AvatarFallback>{initials(chat.title)}</AvatarFallback>
      </Avatar>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-ink">{chat.title}</span>
          {last && <span className="shrink-0 text-xs text-muted">{formatTime(last.timestamp)}</span>}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-muted">
            {last
              ? `${last.direction === 'out' ? 'Вы: ' : ''}${previewText(last.text)}`
              : 'Нет сообщений'}
          </span>
          {chat.unread > 0 && (
            <span className="shrink-0 rounded-full bg-accent px-2 text-xs font-semibold text-white">
              {chat.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
