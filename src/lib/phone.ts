export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  return digits
}

/** Telegram-адресация в GREEN-API использует суффикс @c.us. */
export function phoneToChatId(normalized: string): string {
  return `${normalized}@c.us`
}

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input)
  return n.length >= 10 && n.length <= 15
}

export function formatPhone(digits: string): string {
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('7')) {
    const d = digits.slice(1)
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
  }
  return `+${digits}`
}
