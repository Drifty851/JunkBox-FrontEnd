import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

interface PrimaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  /** Texto del estado Loading (Figma: "Iniciando sesión…", "Creando cuenta…"). */
  loadingLabel: string
  loading?: boolean
}

/**
 * PrimaryButton (Figma 14296:3676) · Estados: Default, Disabled, Loading.
 * Alto 48, ancho completo, radio 8, Body/14/SemiBold.
 */
export function PrimaryButton({ label, loadingLabel, loading = false, disabled, className, type = 'submit', ...rest }: PrimaryButtonProps) {
  const isDisabled = disabled === true && !loading

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'flex h-12 w-full items-center justify-center rounded-lg text-sm leading-none font-semibold transition-opacity',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        isDisabled
          ? 'cursor-not-allowed border border-fg-muted bg-surface-input-disabled text-fg-muted opacity-65'
          : 'bg-action text-on-action',
        loading && 'cursor-progress',
        !isDisabled && !loading && 'cursor-pointer hover:opacity-90',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          {/* ProgressTrack 48×4 (opacidad 45%) + ProgressFill 24×4 */}
          <span aria-hidden="true" className="relative h-1 w-12 overflow-hidden rounded-full">
            <span className="absolute inset-0 rounded-full bg-on-action opacity-45" />
            <span className="absolute top-0 left-0 h-1 w-6 rounded-full bg-on-action motion-safe:animate-[jb-progress_1.1s_ease-in-out_infinite]" />
          </span>
          <span>{loadingLabel}</span>
        </span>
      ) : (
        label
      )}
    </button>
  )
}
