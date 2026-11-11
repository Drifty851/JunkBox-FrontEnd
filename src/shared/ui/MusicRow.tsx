import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '../utils/cn'

interface MusicRowProps {
  title: string
  subtitle: string
  /** Carátula o retrato; `null` muestra el recuadro (o círculo) neutro. */
  imageUrl: string | null
  /** `square` = carátula (radio 4); `circle` = retrato de artista. */
  shape?: 'square' | 'circle'
  /** Calificación ya formateada ("★ 4,6"); se omite si no hay. */
  rating?: string | null
  /** Acción a la derecha (p. ej. el botón de reproducir). */
  action?: ReactNode
  /** Ficha a la que lleva la fila. Toda la fila es pulsable; la acción sigue siendo independiente. */
  to?: string
  className?: string
}

/**
 * MusicRow (Figma · 14296:8113, variantes móvil y escritorio): fila de 64 px con artwork 48×48,
 * título (Body/14/SemiBold), subtítulo (Caption/12, text/secondary-3), calificación
 * (Body/13/Medium) y acción de 28 px. Separación 12 y borde inferior border/default.
 * Con `to`, el título es un enlace que cubre la fila (patrón "stretched link").
 */
export function MusicRow({ title, subtitle, imageUrl, shape = 'square', rating, action, to, className }: MusicRowProps) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded'
  return (
    <div className={cn('relative flex w-full items-center gap-3 border-b border-line py-2', className)}>
      <span className={cn('block size-12 shrink-0 overflow-hidden bg-surface-input-disabled', radius)}>
        {imageUrl !== null && <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
        {to ? (
          <Link
            to={to}
            className="truncate rounded text-sm font-semibold text-fg after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {title}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-fg">{title}</p>
        )}
        <p className="truncate text-xs text-fg-soft">{subtitle}</p>
      </div>
      {rating && <p className="shrink-0 text-[13px] leading-[1.4] font-medium whitespace-nowrap text-fg">{rating}</p>}
      {action && <div className="relative z-10 flex shrink-0">{action}</div>}
    </div>
  )
}
