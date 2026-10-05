import { SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Textarea } from '@/ui'
import { MAX_MESSAGE_LENGTH } from '@/config/constants'
import { cn } from '@/lib/cn'

interface ComposerProps {
  disabled?: boolean
  onSend: (text: string) => void
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }, [text])

  const overLimit = text.length > MAX_MESSAGE_LENGTH
  const canSend = !disabled && text.trim().length > 0 && !overLimit

  const submit = () => {
    if (!canSend) return
    onSend(text.trim())
    setText('')
    textareaRef.current?.focus()
  }

  return (
    <footer className="border-t border-line bg-surface px-4 py-3">
      <div className="chat-column relative flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          rows={1}
          value={text}
          disabled={disabled}
          placeholder={disabled ? 'Нет соединения…' : 'Напишите сообщение…'}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          className="max-h-40"
        />
        <Button
          size="icon"
          className="shrink-0 rounded-full"
          disabled={!canSend}
          onClick={submit}
          aria-label="Отправить сообщение"
        >
          <SendHorizontal className="size-4" />
        </Button>

        {text.length > MAX_MESSAGE_LENGTH - 200 && (
          <span
            className={cn(
              'absolute -top-6 right-0 rounded-full bg-surface px-2 py-0.5 text-xs',
              overLimit ? 'text-danger' : 'text-muted',
            )}
          >
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
      </div>
    </footer>
  )
}
