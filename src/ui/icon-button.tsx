import { cn } from '@/lib/cn'
import { Button, type ButtonProps } from './button'

export function IconButton({ className, variant = 'ghost', size = 'icon', ...props }: ButtonProps) {
  return <Button variant={variant} size={size} className={cn(className)} {...props} />
}
