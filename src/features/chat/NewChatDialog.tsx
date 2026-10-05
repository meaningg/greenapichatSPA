import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from '@/ui'
import { isValidPhone, normalizePhone, phoneToChatId } from '@/lib/phone'
import { useSessionStore } from '@/store/sessionStore'

const schema = z.object({
  phone: z.string().refine(isValidPhone, 'Введите корректный номер'),
})

type FormValues = z.infer<typeof schema>

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const createChat = useSessionStore((state) => state.createChat)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  })

  const phone = watch('phone') ?? ''
  const normalized = normalizePhone(phone)
  const valid = isValidPhone(phone)

  const close = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const onSubmit = handleSubmit(({ phone: value }) => {
    createChat({ phone: normalizePhone(value) })
    close(false)
  })

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>Введите номер телефона получателя в Telegram.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormField
            label="Номер телефона"
            htmlFor="phone"
            error={errors.phone?.message}
            hint={valid ? `Chat ID: ${phoneToChatId(normalized)}` : undefined}
          >
            <Input
              id="phone"
              type="tel"
              placeholder="+7 999 123-45-67"
              autoComplete="off"
              invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!valid}>
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
