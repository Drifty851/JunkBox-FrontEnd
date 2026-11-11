import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import starRating32Icon from '../../assets/icons/star-rating-32.svg'
import { formatRating } from '../utils/formatRating'

/** Geometría del recurso de Figma (StarRating · Rating-08): 5 estrellas de 32 con 4 de separación. */
const STAR = 32
const GAP = 4
const WIDTH = 176
const HEIGHT = 32

interface StarRatingInputProps {
  /** 0 = sin calificar; si no, de 0.5 a 5 en pasos de 0.5. */
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  /** Nombre accesible, p. ej. "Tu calificación". */
  label: string
  /** Id del texto que describe el valor ("4,5 de 5 · Increíble"). */
  describedBy?: string
}

/** Ancho relleno para un valor: estrellas completas + media estrella. */
const fillWidth = (value: number) => Math.min(WIDTH, Math.floor(value) * (STAR + GAP) + (value % 1 ? STAR / 2 : 0))

/** Valor bajo el puntero: mitad izquierda de una estrella = media, derecha = entera. */
function valueAt(x: number): number {
  const index = Math.max(0, Math.min(4, Math.floor(x / (STAR + GAP))))
  const within = x - index * (STAR + GAP)
  return index + (within < STAR / 2 ? 0.5 : 1)
}

/**
 * Estrellas editables (Figma · RatingInput de Escribir Reseña: StarRating 176×32). Se califica
 * de media en media estrella, como el backend (0.5–5.0):
 *  - Ratón/táctil: la mitad izquierda de una estrella vale media; la derecha, entera.
 *  - Teclado (rol "slider"): ← ↓ restan 0,5 · → ↑ suman 0,5 · Inicio = 0,5 · Fin = 5.
 * El recurso original se usa como máscara: vacío en color de borde y relleno en color de texto.
 */
export function StarRatingInput({ value, onChange, disabled = false, label, describedBy }: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value

  const mask = (color: string): CSSProperties => ({
    maskImage: `url("${starRating32Icon}")`,
    maskSize: `${WIDTH}px ${HEIGHT}px`,
    maskRepeat: 'no-repeat',
    WebkitMaskImage: `url("${starRating32Icon}")`,
    WebkitMaskSize: `${WIDTH}px ${HEIGHT}px`,
    WebkitMaskRepeat: 'no-repeat',
    backgroundColor: color,
  })

  const xOf = (event: PointerEvent<HTMLDivElement>) => event.clientX - event.currentTarget.getBoundingClientRect().left

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const keys: Record<string, number> = {
      ArrowRight: value + 0.5,
      ArrowUp: value + 0.5,
      ArrowLeft: value - 0.5,
      ArrowDown: value - 0.5,
      Home: 0.5,
      End: 5,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    onChange(Math.max(0.5, Math.min(5, keys[event.key])))
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-describedby={describedBy}
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value > 0 ? value : undefined}
      aria-valuetext={value > 0 ? `${formatRating(value)} de 5 estrellas` : 'Sin calificar'}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      onPointerMove={(event) => !disabled && event.pointerType === 'mouse' && setHover(valueAt(xOf(event)))}
      onPointerLeave={() => setHover(null)}
      onPointerDown={(event) => {
        if (disabled) return
        onChange(valueAt(xOf(event)))
      }}
      className="relative shrink-0 cursor-pointer touch-none rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg aria-disabled:cursor-default aria-disabled:opacity-60"
      style={{ width: WIDTH, height: HEIGHT }}
    >
      <span aria-hidden="true" className="absolute inset-0" style={mask('var(--jb-border)')} />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ ...mask('var(--jb-fg)'), width: fillWidth(shown) }}
      />
    </div>
  )
}
