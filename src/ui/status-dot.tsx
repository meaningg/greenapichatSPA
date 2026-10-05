import { cn } from '@/lib/cn'
import type { ConnectionStatus } from '@/api/types'

const STYLES: Record<ConnectionStatus, { dot: string; label: string; text: string }> = {
  idle: { dot: 'bg-muted', label: 'Не подключено', text: 'text-muted' },
  polling: { dot: 'bg-warning animate-pulse-dot', label: 'Подключение…', text: 'text-warning' },
  online: { dot: 'bg-accent', label: 'В сети', text: 'text-accent' },
  offline: { dot: 'bg-danger', label: 'Нет связи', text: 'text-danger' },
}

interface StatusDotProps {
  status: ConnectionStatus
  showLabel?: boolean
  className?: string
}

export function StatusDot({ status, showLabel = true, className }: StatusDotProps) {
  const style = STYLES[status]
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs', style.text, className)}>
      <span className={cn('size-2 rounded-full', style.dot)} />
      {showLabel && style.label}
    </span>
  )
}
