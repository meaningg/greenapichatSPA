import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-6" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      </div>
    </div>
  )
}
