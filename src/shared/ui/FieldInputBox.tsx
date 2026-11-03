import type { ReactNode } from 'react'
import alertCircleIcon from '../../assets/icons/alert-circle.svg'
import lockIcon from '../../assets/icons/lock.svg'
import { cn } from '../utils/cn'
import { MaskIcon } from './MaskIcon'

export interface FieldInputBoxProps {
  invalid?: boolean
  disabled?: boolean
  /** Contenido de la caja: el <input> y, si aplica, el control de visibilidad. */
  children: ReactNode
}

/**
 * Caja visual que comparten TextInput y PasswordInput (Figma 14296:3707 / 14296:3770).
 * Alto 48, padding horizontal 16, separación 8, radio 8.
 *
 * Estados de Figma:
 *  - Default: borde 1px border/default.
 *  - Focus: borde 2px text/primary (se dibuja con una sombra interior para que el contenido no se mueva).
 *  - Error: borde 2px brand/accent, más ErrorIndicator (alert-circle + "Revisa el campo").
 *  - Disabled: fondo surface/input-2, borde text/secondary, opacidad 65%, más DisabledIndicator (lock + "No disponible").
 */
export function FieldInputBox({ invalid = false, disabled = false, children }: FieldInputBoxProps) {
  return (
    <div
      className={cn(
        'flex h-12 w-full items-center gap-2 rounded-lg border px-4 transition-shadow',
        disabled
          ? 'border-fg-muted bg-surface-input-disabled opacity-65'
          : invalid
            ? 'border-accent bg-surface-input shadow-[inset_0_0_0_1px_var(--color-accent)]'
            : 'border-line bg-surface-input focus-within:border-fg focus-within:shadow-[inset_0_0_0_1px_var(--color-fg)]',
      )}
    >
      {children}
      {invalid && !disabled && (
        <span className="flex shrink-0 items-center gap-1">
          {/* alert-circle tiene dos colores (relleno + trazo); se usa la imagen original. */}
          <img src={alertCircleIcon} alt="" width={16} height={16} aria-hidden="true" />
          <span className="text-xs leading-none text-fg">Revisa el campo</span>
        </span>
      )}
      {disabled && (
        <span className="flex shrink-0 items-center gap-1">
          <MaskIcon src={lockIcon} size={16} className="bg-fg-placeholder" />
          <span className="text-xs leading-none text-fg-muted">No disponible</span>
        </span>
      )}
    </div>
  )
}

/** Clases del <input> dentro de la caja: Body/14/Regular/140pct, placeholder text/secondary-2. */
export const fieldInputClassName =
  'min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-fg outline-none placeholder:text-fg-placeholder disabled:cursor-not-allowed disabled:text-fg-muted'
