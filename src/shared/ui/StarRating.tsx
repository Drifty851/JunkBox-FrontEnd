import type { CSSProperties } from 'react'
import starRatingIcon from '../../assets/icons/star-rating.svg'
import { formatRating } from '../utils/formatRating'

/** Tamaños de Figma: Rating-06 (76×12), Rating-04 (96×16) y Rating-05 del MusicHero (106×18). */
const SIZES = { sm: [76, 12], md: [96, 16], lg: [106, 18] } as const

interface StarRatingProps {
  /** Promedio de 0 a 5. */
  value: number
  size?: keyof typeof SIZES
}

/**
 * StarRating (Figma · 14296:5021): las 5 estrellas originales como máscara. Debajo, en el
 * color de borde; encima, en el color de texto y recortadas al promedio (4,6 → 92 % del ancho).
 * Figma solo muestra 5 estrellas llenas; el tramo vacío es la adaptación a promedios reales.
 */
export function StarRating({ value, size = 'md' }: StarRatingProps) {
  const [width, height] = SIZES[size]
  const percent = Math.max(0, Math.min(5, value)) * 20
  const mask = (color: string): CSSProperties => ({
    maskImage: `url("${starRatingIcon}")`,
    maskSize: `${width}px ${height}px`,
    maskRepeat: 'no-repeat',
    WebkitMaskImage: `url("${starRatingIcon}")`,
    WebkitMaskSize: `${width}px ${height}px`,
    WebkitMaskRepeat: 'no-repeat',
    backgroundColor: color,
  })
  return (
    <span
      role="img"
      aria-label={`${formatRating(value)} de 5 estrellas`}
      className="relative block shrink-0"
      style={{ width, height }}
    >
      <span aria-hidden="true" className="absolute inset-0" style={mask('var(--jb-border)')} />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ ...mask('var(--jb-fg)'), width: `${percent}%` }}
      />
    </span>
  )
}
