import { TriangleAlert } from 'lucide-react'
import type { InstanceState } from '@/api/types'

const HINTS: Partial<Record<InstanceState, string>> = {
  notAuthorized:
    'Инстанс не авторизован. Откройте личный кабинет GREEN-API и завершите привязку аккаунта Telegram для этого инстанса.',
  blocked: 'Аккаунт заблокирован мессенджером. Отправка сообщений недоступна.',
  starting:
    'Инстанс запускается. Приём сообщений станет доступен после завершения авторизации.',
}

interface AccountNoticeProps {
  state: InstanceState
}

export function AccountNotice({ state }: AccountNoticeProps) {
  const hint = HINTS[state]
  if (!hint) return null

  return (
    <div className="mx-4 mt-3">
      <div
        role="status"
        className="chat-column flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span className="wrap-break-word">{hint}</span>
      </div>
    </div>
  )
}
