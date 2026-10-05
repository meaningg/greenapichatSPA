import { LogOut, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, IconButton, Input, ScrollArea, Tooltip } from '@/ui'
import { useSessionStore } from '@/store/sessionStore'
import { ChatListItem } from './ChatListItem'

interface SidebarProps {
  onNewChat: () => void
}

export function Sidebar({ onNewChat }: SidebarProps) {
  const chats = useSessionStore((state) => state.chats)
  const activeChatId = useSessionStore((state) => state.activeChatId)
  const setActiveChat = useSessionStore((state) => state.setActiveChat)
  const logout = useSessionStore((state) => state.logout)

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!needle) return sorted
    return sorted.filter(
      (chat) =>
        chat.title.toLowerCase().includes(needle) || chat.chatId.toLowerCase().includes(needle),
    )
  }, [chats, query])

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-semibold text-ink">Чаты</span>
        <Tooltip content="Выйти">
          <IconButton onClick={logout} aria-label="Выйти">
            <LogOut className="size-4" />
          </IconButton>
        </Tooltip>
      </header>

      <div className="relative px-4 pt-3">
        <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="px-4 py-3">
        <Button className="w-full" onClick={onNewChat}>
          <Plus className="size-4" />
          Новый чат
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">
              {chats.length === 0 ? 'Пока нет чатов' : 'Ничего не найдено'}
            </p>
          ) : (
            filtered.map((chat) => (
              <ChatListItem
                key={chat.chatId}
                chat={chat}
                active={chat.chatId === activeChatId}
                onSelect={setActiveChat}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
