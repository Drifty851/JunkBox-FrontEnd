import type { CSSProperties } from 'react'
import { cn } from '../../../shared/utils/cn'
import type { LandingCover } from '../data/landingCovers'

/** Portadas por fila: 10 en escritorio (8 filas = 80) y 5 en móvil (8 filas = 40). */
const DESKTOP_PER_ROW = 10
const MOBILE_PER_ROW = 5
/** Filas de escritorio: 4 arriba (las 40 primeras portadas) y 4 abajo (las 40 siguientes). */
const DESKTOP_ROWS = 8
/** Opacidad compartida (75 %) y máscaras radiales que dejan el centro despejado para el logo y los botones. */
const WALL_CLASSES = 'pointer-events-none absolute inset-0 overflow-hidden opacity-75 select-none'
const maskStyle = (mask: string): CSSProperties => ({ maskImage: mask, WebkitMaskImage: mask })
const MOBILE_MASK = maskStyle('radial-gradient(ellipse 62% 68% at 50% 50%, transparent 0%, transparent 42%, black 88%)')
/**
 * Escritorio: zona despejada más pequeña que en móvil (elipse 45 % × 40 %, transparente hasta el
 * 55 %) para que también se vean las filas más cercanas al centro. Ajustada midiendo de
 * 1024×768 a 1920×1080: las 8 filas quedan visibles y el bloque central, limpio.
 */
const DESKTOP_MASK = maskStyle('radial-gradient(ellipse 45% 40% at 50% 50%, transparent 0%, transparent 55%, black 100%)')

/** Parte la lista en filas de `size` (la última puede quedar más corta). */
function chunk(list: readonly LandingCover[], size: number): LandingCover[][] {
  const rows: LandingCover[][] = []
  for (let start = 0; start < list.length; start += size) rows.push(list.slice(start, start + size))
  return rows
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

interface MarqueeRowProps {
  covers: LandingCover[]
  /** Segundos que tarda en recorrer media pista (una vuelta completa de la fila). */
  duration: number
  /** `true` = de izquierda a derecha (keyframes jb-marquee-x en sentido inverso). */
  reverse: boolean
  coverClassName: string
  className?: string
}

/** Fila tipo carrusel: la fila va dos veces y se desplaza la mitad de la pista. */
function MarqueeRow({ covers, duration, reverse, coverClassName, className }: MarqueeRowProps) {
  const style: CSSProperties = { animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="flex w-max gap-3 animate-marquee-x" style={style}>
        {[...covers, ...covers].map((cover, index) => (
          <Cover key={`${cover.imageUrl}-${index}`} cover={cover} className={coverClassName} />
        ))}
      </div>
    </div>
  )
}

/**
 * Lado de cada portada de escritorio: las 8 filas (más los huecos) deben cubrir el alto de la
 * pantalla más lo que sube la inclinación a lo ancho (≈ 14vw con −8°).
 */
const DESKTOP_COVER = 'size-[calc((100vh+14vw)/8-12px)]'

/**
 * Fondo de escritorio (md+): 8 filas que cruzan la pantalla de lado a lado, inclinadas −8° (lo más
 * horizontal posible sin dejar de ser diagonales) y apiladas sin cruzarse: las 4 de arriba con las
 * 40 primeras portadas y las 4 de abajo con las 40 siguientes, alternando sentido y velocidad.
 * Cada fila repite sus 10 portadas para que la pista nunca deje fondo vacío. Opacidad 75 % y
 * máscara radial que despeja el centro. Decorativo (`aria-hidden`). Se mueve siempre, aunque el
 * sistema pida "reducir movimiento" (decisión del propietario, 2026-11-11).
 */
export function CoverWall({ covers }: { covers: readonly LandingCover[] }) {
  const rows = chunk(covers, DESKTOP_PER_ROW).slice(0, DESKTOP_ROWS)
  return (
    <div aria-hidden="true" className={cn(WALL_CLASSES, 'hidden md:block')} style={DESKTOP_MASK}>
      <div
        className="absolute top-1/2 -left-[20vw] flex w-[140vw] flex-col gap-3"
        style={{ transform: 'translateY(-50%) rotate(-8deg)' }}
      >
        {rows.map((row, index) => (
          <MarqueeRow
            key={index}
            covers={[...row, ...row]}
            duration={90 + (index % 4) * 15}
            reverse={index % 2 === 0}
            coverClassName={DESKTOP_COVER}
            className="w-full"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Fondo de móvil: filas en carrusel que cubren toda la pantalla (40 portadas en filas de 5),
 * alternando sentido y velocidad, con la misma opacidad y máscara radial que escritorio
 * (petición del propietario, 2026-11-13). Decorativo (`aria-hidden`).
 */
export function MobileCoverWall({ covers }: { covers: readonly LandingCover[] }) {
  const rows = chunk(covers, MOBILE_PER_ROW)
  return (
    <div
      aria-hidden="true"
      className={cn(WALL_CLASSES, 'flex flex-col justify-center gap-3 md:hidden')}
      style={MOBILE_MASK}
    >
      {rows.map((row, index) => (
        <MarqueeRow
          key={index}
          covers={row}
          duration={40 + (index % 4) * 8}
          reverse={index % 2 === 0}
          coverClassName="size-24"
          className="w-full shrink-0"
        />
      ))}
    </div>
  )
}
