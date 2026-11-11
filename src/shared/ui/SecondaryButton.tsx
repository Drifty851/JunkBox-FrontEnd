import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

interface SecondaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string
}

/**
 * Button secundario (Figma · Button 14296:3647, variantes Button-15/16): alto 44, padding 16,
 * radio 8, fondo action/background-4, borde border/default, texto Body/14/Medium.
 * Ancho según el contenido; para el ancho completo pasar `className="w-full"`.
 * `aria-disabled` lo deja visible pero sin acción (destinos que aún no existen).
 */
export function SecondaryButton({ label, className, onClick, ...rest }: SecondaryButtonProps) {
  const inert = rest['aria-disabled'] === true || rest['aria-disabled'] === 'true'
  return (
    <button
      type="button"
      onClick={inert ? undefined : onClick}
      className={cn(
        'flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-quickplay px-4 text-sm leading-[1.4] font-medium whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg aria-disabled:cursor-default aria-disabled:text-fg-placeholder',
        className,
      )}
      {...rest}
    >
      {label}
    </button>
  )
}
