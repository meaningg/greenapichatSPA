import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Chat, Message } from '@/api/types'
import { formatDate, isSameDay } from '@/lib/format'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  chat: Chat
  onRetry: (message: Message) => void
}

type ListItem =
  | { kind: 'date'; key: string; timestamp: number }
  | { kind: 'message'; key: string; message: Message }

const OVERSCAN = 8
/** Отступ между строками задаёт виртуализатор (`gap`), а не CSS-margin. */
const ROW_GAP_PX = 6
/** Вертикальные отступы списка задаются виртуализатору, иначе нижний теряется при скролле. */
const LIST_PADDING_Y_PX = 16
/** В этих пределах от конца списка новые сообщения доскролливают вниз. */
const END_THRESHOLD_PX = 32

/**
 * Высоты ещё не отрендеренных строк. Точные размеры виртуализатор измеряет сам
 * (`measureElement`) и компенсирует сдвиг через `anchorTo: 'end'`, поэтому оценка
 * влияет только на невидимую область. Константы откалиброваны под реальный CSS.
 */
const DATE_ROW_HEIGHT = 36
const MESSAGE_CHROME_PX = 30
const MESSAGE_LINE_HEIGHT = 23
const APPROX_CHARS_PER_LINE = 48

function estimateLines(text: string): number {
  return text
    .split('\n')
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / APPROX_CHARS_PER_LINE)), 0)
}

function estimateItemSize(item: ListItem): number {
  if (item.kind === 'date') return DATE_ROW_HEIGHT
  return MESSAGE_CHROME_PX + estimateLines(item.message.text) * MESSAGE_LINE_HEIGHT
}

function MessageListImpl({ chat, onRetry }: MessageListProps) {
  const { messages } = chat
  const scrollRef = useRef<HTMLDivElement>(null)

  const items = useMemo<ListItem[]>(() => {
    const result: ListItem[] = []
    let previous: number | null = null
    for (const message of messages) {
      if (previous === null || !isSameDay(previous, message.timestamp)) {
        result.push({ kind: 'date', key: `d-${message.id}`, timestamp: message.timestamp })
        previous = message.timestamp
      }
      result.push({ kind: 'message', key: message.id, message })
    }
    return result
  }, [messages])

  const getItemKey = useCallback((index: number) => items[index].key, [items])
  const estimateSize = useCallback((index: number) => estimateItemSize(items[index]), [items])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: OVERSCAN,
    gap: ROW_GAP_PX,
    paddingStart: LIST_PADDING_Y_PX,
    paddingEnd: LIST_PADDING_Y_PX,
    getItemKey,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: END_THRESHOLD_PX,
  })

  // Открытие чата всегда начинается с последнего сообщения. Дальнейшие входящие
  // доскролливает сам виртуализатор (`followOnAppend`), пока мы у конца списка.
  useEffect(() => {
    virtualizer.scrollToEnd()
  }, [chat.chatId, virtualizer])

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="scrollbar-thin flex flex-1 flex-col overflow-y-auto px-5 py-4"
      >
        <div className="chat-column m-auto">
          <p className="text-center text-sm text-muted">Нет сообщений. Напишите первым.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="scrollbar-thin flex flex-1 flex-col overflow-y-auto px-5">
      <div
        className="chat-column relative shrink-0"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index]
          return (
            <div
              key={item.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {item.kind === 'date' ? (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-black/25 px-3 py-0.5 text-xs text-muted">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              ) : (
                <MessageBubble message={item.message} onRetry={onRetry} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const MessageList = memo(MessageListImpl)
