import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink transition-colors',
        'placeholder:text-muted focus-visible:outline-none',
        invalid ? 'border-danger focus-visible:border-danger' : 'focus-visible:border-accent',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
