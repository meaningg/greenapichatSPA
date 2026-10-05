export const API_URL = (import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com').replace(
  /\/+$/,
  '',
)

export const MAX_MESSAGE_LENGTH = 4096

export const RECEIVE_TIMEOUT_SECONDS = 10

/**
 * Гарантированный минимум между итерациями приёма: защищает от «горячего» цикла,
 * если сервер отвечает мгновенно, и от превышения лимита запросов (429).
 */
export const MIN_RECEIVE_INTERVAL_MS = 1000

export const RECEIVE_BACKOFF_BASE_MS = 1_500
export const RECEIVE_BACKOFF_MAX_MS = 30_000

/** При 429 обычного backoff мало — упираемся в лимит снова. */
export const RATE_LIMIT_BACKOFF_MS = 15_000

export const ACCOUNT_STATE_INTERVAL_MS = 60_000

export const STORAGE_KEY = 'greenapi.telegram.session.v1'
