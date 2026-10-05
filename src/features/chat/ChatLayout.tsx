import { useState } from 'react'
import { useReceiveLoop } from '@/hooks/useReceiveLoop'
import { useAccountState } from '@/query/hooks'
import { useSessionStore } from '@/store/sessionStore'
import { cn } from '@/lib/cn'
import { ChatWindow } from './ChatWindow'
import { NewChatDialog } from './NewChatDialog'
import { Sidebar } from './Sidebar'

export function ChatLayout() {
  const account = useAccountState()
  // Не опрашиваем уведомления, пока инстанс заведомо не авторизован:
  // это лишние запросы и риск упереться в лимит (429).
  const instanceState = account.data?.stateInstance
  const receiveEnabled = instanceState !== 'notAuthorized' && instanceState !== 'blocked'

  useReceiveLoop(receiveEnabled)

  const activeChatId = useSessionStore((state) => state.activeChatId)
  const [newChatOpen, setNewChatOpen] = useState(false)

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden md:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      <div className={cn('min-h-0', activeChatId ? 'hidden md:block' : 'block')}>
        <Sidebar onNewChat={() => setNewChatOpen(true)} />
      </div>
      <div className={cn('flex min-h-0', activeChatId ? 'flex' : 'hidden md:flex')}>
        <ChatWindow />
      </div>
      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />
    </div>
  )
}
