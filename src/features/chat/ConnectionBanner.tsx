import { X } from 'lucide-react'
import { IconButton } from '@/ui'
import { useSessionStore } from '@/store/sessionStore'

export function ConnectionBanner() {
  const lastError = useSessionStore((state) => state.lastError)
  const setLastError = useSessionStore((state) => state.setLastError)

  if (!lastError) return null

  return (
    <div className="mx-4 mt-3">
      <div
        role="alert"
        className="chat-column flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        <span className="flex-1 wrap-break-word">{lastError}</span>
        <IconButton
          size="icon-sm"
          className="text-current"
          onClick={() => setLastError(null)}
          aria-label="Скрыть"
        >
          <X className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}
