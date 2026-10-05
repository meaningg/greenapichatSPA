import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Send, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, FormField, Input, Spinner } from '@/ui'
import { useValidateCredentials } from '@/query/hooks'

const schema = z.object({
  idInstance: z.string().trim().regex(/^\d+$/, 'Только цифры'),
  apiTokenInstance: z.string().trim().min(8, 'Проверьте токен'),
})

type FormValues = z.infer<typeof schema>

export function LoginScreen() {
  const validate = useValidateCredentials()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { idInstance: '', apiTokenInstance: '' },
  })

  const onSubmit = handleSubmit((values) => {
    validate.mutate(values)
  })

  return (
    <div className="flex min-h-full items-center justify-center bg-[radial-gradient(1100px_520px_at_50%_-10%,#1b2a38,transparent_60%)] p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-line bg-surface p-7 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Send className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">GREEN-API</p>
            <h1 className="text-lg font-semibold text-ink">Чаты Telegram</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted">
          Введите данные инстанса из{' '}
          <a
            className="text-accent hover:underline"
            href="https://console.green-api.com"
            target="_blank"
            rel="noreferrer"
          >
            личного кабинета
          </a>{' '}
          GREEN-API.
        </p>

        <div className="flex flex-col gap-4">
          <FormField label="idInstance" htmlFor="idInstance" error={errors.idInstance?.message}>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                id="idInstance"
                className="pl-9"
                inputMode="numeric"
                autoComplete="off"
                placeholder="1101000000"
                invalid={Boolean(errors.idInstance)}
                {...register('idInstance')}
              />
            </div>
          </FormField>

          <FormField
            label="apiTokenInstance"
            htmlFor="apiTokenInstance"
            error={errors.apiTokenInstance?.message}
            hint="Данные хранятся только в вашем браузере"
          >
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                id="apiTokenInstance"
                className="pl-9"
                type="password"
                autoComplete="off"
                placeholder="a1b2c3d4e5f6…"
                invalid={Boolean(errors.apiTokenInstance)}
                {...register('apiTokenInstance')}
              />
            </div>
          </FormField>
        </div>

        {validate.isError && (
          <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {validate.error instanceof Error ? validate.error.message : 'Не удалось подключиться'}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          disabled={!isValid || validate.isPending}
        >
          {validate.isPending ? (
            <>
              <Spinner /> Проверяем…
            </>
          ) : (
            'Подключиться'
          )}
        </Button>
      </form>
    </div>
  )
}
