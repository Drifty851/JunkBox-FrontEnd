import type { CSSProperties } from 'react'
import { cn } from '../../../shared/utils/cn'
import { LANDING_COVERS, type LandingCover } from '../data/landingCovers'

/** Portadas por fila (escritorio) y por carrusel (móvil). */
const PER_COLUMN = 10
const PER_STRIP = 20

/** Gira la lista `offset` posiciones: cada columna empieza en una portada distinta. */
function rotate(list: readonly LandingCover[], offset: number): LandingCover[] {
  const start = ((offset % list.length) + list.length) % list.length
  return [...list.slice(start), ...list.slice(0, start)]
}

function Cover({ cover, className }: { cover: LandingCover; className: string }) {
  return (
    <span className={cn('block shrink-0 overflow-hidden rounded bg-surface-input-disabled', className)}>
      <img
        src={cover.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover"
        onError={(event) => {
          event.currentTarget.style.visibility = 'hidden'
        }}
      />
    </span>
  )
}

interface ColumnProps {
  covers: LandingCover[]
  /** Segundos que tarda en recorrer media pista (una vuelta completa de la lista). */
  duration: number
  reverse?: boolean
}

/**
 * Fila tipo carrusel: la lista va dos veces y se desplaza la mitad de la pista. `reverse` =
 * de izquierda a derecha (keyframes jb-marquee-x en sentido inverso); si no, de derecha a izquierda.
 */
function MarqueeRow({ covers, duration, reverse = false }: ColumnProps) {
  const style: CSSProperties = { animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }
  return (
    <div className="w-[75vw] overflow-hidden">
      <div className="flex w-max gap-3 animate-marquee-x" style={style}>
        {[...covers, ...covers].map((cover, index) => (
          <Cover key={`${cover.imageUrl}-${index}`} cover={cover} className="size-28 lg:size-32" />
        ))}
      </div>
    </div>
  )
}

/**
 * Grupo de 4 filas en una esquina (escritorio), con una ligera inclinación diagonal. Las filas
 * alternan sentido (izquierda → derecha, derecha → izquierda…) y velocidad.
 */
function CornerCluster({ corner, offset }: { corner: 'top-left' | 'bottom-right'; offset: number }) {
  const rows = [0, 1, 2, 3].map((index) => rotate(LANDING_COVERS, offset + index * PER_COLUMN).slice(0, PER_COLUMN))
  return (
    <div
      className={cn('absolute flex flex-col gap-3', corner === 'top-left' ? '-top-[14vh] -left-[18vw]' : '-right-[18vw] -bottom-[14vh]')}
      style={{ transform: 'rotate(-12deg)' }}
    >
      {rows.map((covers, index) => (
        <MarqueeRow key={index} covers={covers} duration={60 + index * 10} reverse={index % 2 === 0} />
      ))}
    </div>
  )
}

/**
 * Fondo de escritorio (md+): 4 filas arriba a la izquierda y 4 abajo a la derecha, ligeramente
 * inclinadas, que se desplazan como carrusel alternando sentido: una de izquierda a derecha y la
 * siguiente de derecha a izquierda (petición del propietario). Opacidad 75 % y una máscara radial que deja el centro despejado
 * para el logo, el eslogan y los botones. Decorativo (`aria-hidden`).
 * Se mueve siempre, aunque el sistema pida "reducir movimiento" (decisión del propietario, 2026-11-11).
 */
export function CoverWall() {
  const mask = 'radial-gradient(ellipse 62% 68% at 50% 50%, transparent 0%, transparent 42%, black 88%)'
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-75 select-none md:block"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <CornerCluster corner="top-left" offset={0} />
      <CornerCluster corner="bottom-right" offset={PER_COLUMN * 2} />
    </div>
  )
}

/**
 * Carrusel horizontal de móvil: arriba se mueve hacia la izquierda y abajo hacia la derecha.
 * Decorativo (`aria-hidden`); los bordes se desvanecen con una máscara lineal.
 */
export function CoverStrip({ position }: { position: 'top' | 'bottom' }) {
  const covers = rotate(LANDING_COVERS, position === 'top' ? 0 : PER_STRIP).slice(0, PER_STRIP)
  const mask = 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)'
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none w-full overflow-hidden opacity-80 select-none md:hidden"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div
        className="flex w-max gap-3 animate-marquee-x"
        style={{ animationDuration: '60s', animationDirection: position === 'top' ? 'normal' : 'reverse' }}
      >
        {[...covers, ...covers].map((cover, index) => (
          <Cover key={`${cover.imageUrl}-${index}`} cover={cover} className="size-24" />
        ))}
      </div>
    </div>
  )
}
