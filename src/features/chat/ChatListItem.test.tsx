import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Chat } from '@/api/types'
import { ChatListItem } from './ChatListItem'

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    chatId: '79991234567@c.us',
    phone: '79991234567',
    title: 'Иван Петров',
    messages: [],
    unread: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('ChatListItem', () => {
  it('показывает заголовок и заглушку без сообщений', () => {
    render(<ChatListItem chat={makeChat()} active={false} onSelect={vi.fn()} />)

    expect(screen.getByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('Нет сообщений')).toBeInTheDocument()
  })

  it('показывает превью последнего исходящего сообщения', () => {
    const chat = makeChat({
      messages: [
        {
          id: 'out-1',
          chatId: '79991234567@c.us',
          text: 'Готово',
          direction: 'out',
          timestamp: 1_700_000_000,
          status: 'sent',
        },
      ],
    })

    render(<ChatListItem chat={chat} active={false} onSelect={vi.fn()} />)

    expect(screen.getByText(/Вы: Готово/)).toBeInTheDocument()
  })

  it('показывает счётчик непрочитанных', () => {
    render(<ChatListItem chat={makeChat({ unread: 3 })} active={false} onSelect={vi.fn()} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('не показывает счётчик, когда непрочитанных нет', () => {
    render(<ChatListItem chat={makeChat({ unread: 0 })} active={false} onSelect={vi.fn()} />)

    expect(screen.queryByText('3')).not.toBeInTheDocument()
  })

  it('вызывает onSelect с chatId по клику', () => {
    const onSelect = vi.fn()
    render(<ChatListItem chat={makeChat()} active={false} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Иван Петров'))

    expect(onSelect).toHaveBeenCalledWith('79991234567@c.us')
  })
})
