import { cn } from '../utils/cn'

/** Estado y acción del botón (los aporta el módulo social con `useFollow`). */
export interface FollowControl {
  following: boolean
  /** Petición en curso: el botón no acepta otro clic. */
  pending: boolean
  onToggle: () => void
}

/** Texto de los destinos que todavía no conectan Seguir. */
const UNAVAILABLE = 'Seguir estará disponible en esta pantalla próximamente.'

/**
 * Button · Layout=Shared, Variant=Follow / Following (Figma 14296:3462 / 14296:3539): alto 32,
 * padding 12, radio 8, borde border/default, fondo action/background-4 y Body/14/Medium. "Seguir" o
 * "Siguiendo" con el mismo estilo; pulsar "Siguiendo" deja de seguir sin confirmación (decisión del
 * propietario, 2026-11-19). Sin `control`, se muestra sin acción (`aria-disabled`).
 */
export function FollowButton({ name, control, className }: { name: string; control?: FollowControl; className?: string }) {
  const following = control?.following ?? false
  return (
    <button
      type="button"
      onClick={control ? control.onToggle : undefined}
      aria-disabled={!control || control.pending || undefined}
      aria-pressed={control ? following : undefined}
      aria-label={following ? `Dejar de seguir a ${name}` : `Seguir a ${name}`}
      title={control ? undefined : UNAVAILABLE}
      className={cn(
        'relative z-[1] flex h-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-quickplay px-3 text-sm leading-[1.4] font-medium whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        control ? 'cursor-pointer hover:bg-surface-input-disabled' : 'cursor-default',
        control?.pending && 'cursor-progress',
        className,
      )}
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
