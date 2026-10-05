import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Label } from './label'

interface FormFieldProps {
  label?: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-muted">{hint}</span>
      )}
    </div>
  )
}
