import type { CSSProperties } from 'react'
import { cn } from '../../../shared/utils/cn'
import { LANDING_COVERS, type LandingCover } from '../data/landingCovers'

/** Portadas por columna diagonal (escritorio) y por carrusel (móvil). */
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

/** Columna vertical sin fin: la lista va dos veces y se desplaza la mitad de la pista. */
function MarqueeColumn({ covers, duration, reverse = false }: ColumnProps) {
  const style: CSSProperties = { animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }
  return (
    <div className="h-[150vh] w-28 shrink-0 overflow-hidden lg:w-32">
      <div className="flex flex-col gap-3 animate-marquee-y motion-reduce:animate-none" style={style}>
        {[...covers, ...covers].map((cover, index) => (
          <Cover key={`${cover.imageUrl}-${index}`} cover={cover} className="size-28 lg:size-32" />
        ))}
      </div>
    </div>
  )
}

/** Grupo de 4 columnas diagonales en una esquina (escritorio). */
function CornerCluster({ corner, offset }: { corner: 'top-left' | 'bottom-right'; offset: number }) {
  const columns = [0, 1, 2, 3].map((index) => rotate(LANDING_COVERS, offset + index * PER_COLUMN).slice(0, PER_COLUMN))
  return (
    <div
      className={cn(
        'absolute flex gap-3',
        corner === 'top-left' ? 'top-0 left-0' : 'right-0 bottom-0',
      )}
      // Centrado sobre su esquina y girado: lo más denso queda en la esquina y la máscara lo desvanece hacia el centro.
      style={{ transform: `translate(${corner === 'top-left' ? '-50%, -50%' : '50%, 50%'}) rotate(-35deg)` }}
    >
      {columns.map((covers, index) => (
        <MarqueeColumn key={index} covers={covers} duration={70 + index * 12} reverse={index % 2 === 1} />
      ))}
    </div>
  )
}

/**
 * Fondo de escritorio (md+): 4 columnas diagonales arriba a la izquierda y 4 abajo a la derecha,
 * con desplazamiento continuo. Opacidad 75 % y una máscara radial que deja el centro despejado
 * para el logo, el eslogan y los botones. Decorativo (`aria-hidden`).
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
        className="flex w-max gap-3 animate-marquee-x motion-reduce:animate-none"
        style={{ animationDuration: '60s', animationDirection: position === 'top' ? 'normal' : 'reverse' }}
      >
        {[...covers, ...covers].map((cover, index) => (
          <Cover key={`${cover.imageUrl}-${index}`} cover={cover} className="size-24" />
        ))}
      </div>
    </div>
  )
}
