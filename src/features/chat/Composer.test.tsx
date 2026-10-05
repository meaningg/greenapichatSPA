import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Composer } from './Composer'

function renderComposer(props: Partial<Parameters<typeof Composer>[0]> = {}) {
  const onSend = vi.fn()
  render(<Composer onSend={onSend} {...props} />)
  return { onSend }
}

describe('Composer', () => {
  it('отправляет сообщение по Enter и очищает поле', () => {
    const { onSend } = renderComposer()
    const textarea = screen.getByPlaceholderText('Напишите сообщение…') as HTMLTextAreaElement

    fireEvent.change(textarea, { target: { value: '  Привет  ' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(onSend).toHaveBeenCalledWith('Привет')
    expect(textarea.value).toBe('')
  })

  it('отправляет сообщение по клику на кнопку', () => {
    const { onSend } = renderComposer()
    const textarea = screen.getByPlaceholderText('Напишите сообщение…')

    fireEvent.change(textarea, { target: { value: 'Пока' } })
    fireEvent.click(screen.getByLabelText('Отправить сообщение'))

    expect(onSend).toHaveBeenCalledWith('Пока')
  })

  it('переносит строку по Shift+Enter и не отправляет', () => {
    const { onSend } = renderComposer()
    const textarea = screen.getByPlaceholderText('Напишите сообщение…')

    fireEvent.change(textarea, { target: { value: 'перенос' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('не отправляет пустое сообщение', () => {
    const { onSend } = renderComposer()
    const textarea = screen.getByPlaceholderText('Напишите сообщение…')

    fireEvent.change(textarea, { target: { value: '   ' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('блокирует ввод и отправку при отсутствии соединения', () => {
    renderComposer({ disabled: true })

    expect(screen.getByPlaceholderText('Нет соединения…')).toBeDisabled()
    expect(screen.getByLabelText('Отправить сообщение')).toBeDisabled()
  })
})
