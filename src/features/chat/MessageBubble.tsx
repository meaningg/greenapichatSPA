import { Check, Clock, RotateCw, TriangleAlert } from 'lucide-react'
import { memo } from 'react'
import { Tooltip } from '@/ui'
import type { Message } from '@/api/types'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

interface MessageBubbleProps {
  message: Message
  onRetry?: (message: Message) => void
}

function StatusIndicator({ message, onRetry }: { message: Message; onRetry?: (m: Message) => void }) {
  if (message.status === 'sending') {
    return (
      <Tooltip content="Отправка…">
        <Clock className="size-3.5 text-white/60" />
      </Tooltip>
    )
  }
  if (message.status === 'sent') {
    return (
      <Tooltip content="Отправлено">
        <Check className="size-3.5 text-white/70" />
      </Tooltip>
    )
  }
  if (message.status === 'failed') {
    return (
      <Tooltip content={message.error || 'Не отправлено — нажмите, чтобы повторить'}>
        <button
          type="button"
          onClick={() => onRetry?.(message)}
          className="flex items-center gap-0.5 text-rose-200 transition-colors hover:text-white"
          aria-label="Повторить отправку"
        >
          <TriangleAlert className="size-3.5" />
          <RotateCw className="size-3" />
        </button>
      </Tooltip>
    )
  }
  return null
}

export const MessageBubble = memo(function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'out'

  return (
    <div className={cn('flex animate-pop', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(72%,38rem)] whitespace-pre-wrap wrap-break-word rounded-xl px-3 py-1.5',
          isOutgoing
            ? 'rounded-br-md bg-bubble-out text-ink'
            : 'rounded-bl-md bg-bubble-in text-ink',
        )}
      >
        <span className="text-sm leading-relaxed">{message.text}</span>
        <span className="mt-0.5 flex items-center justify-end gap-1.5">
          {isOutgoing && <StatusIndicator message={message} onRetry={onRetry} />}
          <span className="text-[11px] text-white/55">{formatTime(message.timestamp)}</span>
        </span>
      </div>
    </div>
  )
})
