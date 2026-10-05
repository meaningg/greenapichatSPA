# GREEN-API · Telegram Chat

Веб-чат для отправки и получения текстовых сообщений в **Telegram** через
[GREEN-API](https://green-api.com/telegram).

React 19 + TypeScript + Vite, UI-kit на Radix/CVA/Tailwind v4, Zustand, TanStack Query,
виртуализация списка (`@tanstack/react-virtual`). Тесты на Vitest, CI на GitHub Actions.

## Запуск

```bash
npm install
cp .env.example .env   # VITE_GREEN_API_URL, по умолчанию https://api.green-api.com
npm run dev            # http://localhost:5173
```

```bash
npm run build      # tsc + прод-сборка
npm run preview    # предпросмотр сборки
npm run typecheck  # tsc --noEmit
npm run test:run   # Vitest
```

Требуется Node.js LTS и npm.

## Использование

1. Введите `idInstance` и `apiTokenInstance` → «Подключиться».
2. «Новый чат» → номер телефона получателя.
3. Отправьте сообщение — ответы приходят автоматически (long-poll `ReceiveNotification` → `DeleteNotification`).

Для приёма у инстанса должен быть **пустой `webhookUrl`** и включены уведомления (в кабинете или методом `SetSettings`):

```json
{ "webhookUrl": "", "incomingWebhook": "yes", "outgoingWebhook": "yes", "stateWebhook": "yes" }
```

Если webhook задан, `ReceiveNotification` вернёт ошибку — она покажется в баннере.

## Структура

```
src/
├─ api/       # клиент GREEN-API, типы
├─ config/    # константы (URL, лимиты, таймауты)
├─ store/     # Zustand (persist в localStorage)
├─ query/     # TanStack Query (мутации, опрос состояния)
├─ hooks/     # useReceiveLoop (long-poll + backoff)
├─ ui/        # UI-kit (barrel index.ts)
├─ features/  # auth (LoginScreen), chat (Sidebar, ChatWindow, MessageList, Composer, …)
├─ lib/       # phone, format, cn
└─ test/      # setup Vitest
```

Тесты — рядом с модулями (`*.test.ts(x)`). Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
прогоняет typecheck → тесты → сборку на push/PR.

## Замечания

- Учётные данные и история чатов хранятся только в `localStorage`; кнопка «Выйти» их очищает.
- Запросы идут напрямую к API GREEN-API.
