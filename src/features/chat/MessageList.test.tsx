import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Chat, Message } from '@/api/types'
import { TooltipProvider } from '@/ui'
import { MessageList } from './MessageList'

// В jsdom нет layout, поэтому виртуализатор мокаем: он «рендерит» все строки.
vi.mock('@tanstack/react-virtual', () => {
  const noop = () => {}
  return {
    useVirtualizer: ({ count }: { count: number }) => ({
      getTotalSize: () => count * 64,
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({ index, key: index, start: index * 64 })),
      measureElement: noop,
      scrollToIndex: noop,
      scrollToEnd: noop,
    }),
  }
})

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    chatId: 'c1',
    text: 'Привет',
    direction: 'in',
    timestamp: 1_700_000_000,
    status: 'received',
    ...overrides,
  }
}

function makeChat(messages: Message[]): Chat {
  return {
    chatId: 'c1',
    phone: '79991234567',
    title: 'Иван',
    messages,
    unread: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

function renderList(chat: Chat, onRetry = vi.fn()) {
  render(
    <TooltipProvider>
      <MessageList chat={chat} onRetry={onRetry} />
    </TooltipProvider>,
  )
  return { onRetry }
}

describe('MessageList', () => {
  it('показывает заглушку, когда сообщений нет', () => {
    renderList(makeChat([]))

    expect(screen.getByText('Нет сообщений. Напишите первым.')).toBeInTheDocument()
  })

  it('рендерит сообщения и разделитель даты', () => {
    renderList(
      makeChat([
        makeMessage({ id: 'm1', text: 'Привет' }),
        makeMessage({ id: 'm2', text: 'Как дела?', direction: 'out', status: 'sent' }),
      ]),
    )

    expect(screen.getByText('Привет')).toBeInTheDocument()
    expect(screen.getByText('Как дела?')).toBeInTheDocument()
    expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
  })

  it('вызывает onRetry по клику на кнопку повтора у неудачного сообщения', () => {
    const { onRetry } = renderList(
      makeChat([makeMessage({ id: 'f1', direction: 'out', status: 'failed', text: 'Не ушло' })]),
    )

    fireEvent.click(screen.getByLabelText('Повторить отправку'))

    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }))
  })
})
