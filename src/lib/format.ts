import { format, isSameDay as dfIsSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'

/** timestamp из GREEN-API приходит в секундах; допускаем и миллисекунды. */
export function toMillis(timestamp: number): number {
  if (!timestamp) return Date.now()
  return timestamp > 1e12 ? timestamp : timestamp * 1000
}

export function formatTime(timestamp: number): string {
  return format(toMillis(timestamp), 'HH:mm')
}

export function formatDate(timestamp: number): string {
  const date = toMillis(timestamp)
  const sameYear = new Date(date).getFullYear() === new Date().getFullYear()
  return format(date, sameYear ? 'd MMMM' : 'd MMMM yyyy', { locale: ru })
}

export function isSameDay(a: number, b: number): boolean {
  return dfIsSameDay(toMillis(a), toMillis(b))
}

export function previewText(text: string, max = 60): string {
  const single = text.replace(/\s+/g, ' ').trim()
  return single.length > max ? `${single.slice(0, max - 1)}…` : single
}

export function initials(title: string): string {
  const clean = title.replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  if (!clean) return '#'
  const parts = clean.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
