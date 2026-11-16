import { cn } from '../../../shared/utils/cn'

/** Sin endpoint para seguir (FOL-01, SOLICITUDES_BACKEND.md). */
const PENDING = 'Seguir estará disponible cuando el backend lo permita.'

/**
 * Button · Layout=Shared, Variant=Follow (Figma 14296:3462): alto 32, padding 12, radio 8, borde
 * border/default, fondo action/background-4 y Body/14/Medium. Deshabilitado hasta FOL-01.
 */
export function FollowButton({ name, className }: { name: string; className?: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`Seguir a ${name}`}
      title={PENDING}
      className={cn(
        'relative z-[1] flex h-8 shrink-0 cursor-default items-center justify-center rounded-lg border border-line bg-surface-quickplay px-3 text-sm leading-[1.4] font-medium whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        className,
      )}
    >
      Seguir
    </button>
  )
}
