import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-16.svg'
import play14Icon from '../../../assets/icons/play-14.svg'
import share2Icon from '../../../assets/icons/share-2.svg'
import spotifyLogo from '../../../assets/brand/spotify-logo.png'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { SecondaryButton } from '../../../shared/ui/SecondaryButton'
import { StarRating } from '../../../shared/ui/StarRating'
import { cn } from '../../../shared/utils/cn'
import { formatCount, formatRating } from '../../../shared/utils/formatRating'
import type { RatingSummary } from '../../music/models/catalog.types'
import { SEARCH_PATH } from '../../search/models/search.types'

/** Contenedor de las fichas (Figma · ScrollableContent: móvil 16/12, escritorio 80/32). */
export function DetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 pt-3 pb-6 md:gap-5 md:px-8 md:pt-8 md:pb-10 xl:px-20">
      {children}
    </div>
  )
}

export interface Crumb {
  label: string
  to?: string
}

/**
 * Breadcrumb (Figma · arrow-left 16 + "Buscador / Hoke / BBO", Caption/12, text/secondary-2).
 * La flecha vuelve a la pantalla anterior (o al Buscador si se entró directamente).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const navigate = useNavigate()
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(SEARCH_PATH))
  return (
    <nav aria-label="Ruta de navegación" className="flex min-w-0 items-center gap-2 text-xs leading-[1.4] text-fg-placeholder">
      <button
        type="button"
        onClick={goBack}
        aria-label="Volver"
        className="flex shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <MaskIcon src={arrowLeftIcon} size={16} className="bg-fg" />
      </button>
      <ol className="flex min-w-0 items-center">
        {[{ label: 'Buscador', to: SEARCH_PATH }, ...items].map((item, index, all) => (
          <li key={`${item.label}-${index}`} className={cn('flex min-w-0 items-center', index === all.length - 1 && 'truncate')}>
            {index > 0 && <span aria-hidden="true" className="px-1">/</span>}
            {item.to && index < all.length - 1 ? (
              <Link to={item.to} className="truncate rounded hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === all.length - 1 ? 'page' : undefined} className="truncate">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface MusicHeroProps {
  /** "CANCIÓN", "ÁLBUM" o "ARTISTA". */
  kind: string
  title: string
  /** Línea Title/18/Medium ("Hoke · BBO"); puede llevar enlaces. */
  subtitle: ReactNode
  /** Línea de metadatos ("2022 · 3:24 · Rap español · Spotify"). */
  meta: string
  imageUrl: string | null
  /** Imagen del fondo difuminado si es distinta (p. ej. artista sin foto → su último álbum). */
  backdropUrl?: string | null
  shape?: 'square' | 'circle'
  ratings: RatingSummary
}

/**
 * MusicHero (Figma · 14296:12425). Fondo surface/default-3 con radio 8.
 *  - Franja superior con la carátula difuminada (blur 20, opacidad 16 %): 171 px en móvil, 304 en escritorio.
 *  - Music identity: artwork 136 (móvil) / 240 (escritorio), separación 16/32, padding 16/32.
 *    Tipo Caption/11/SemiBold, título Heading/24 (móvil) / 56 (escritorio) Bold, subtítulo
 *    Body/13 / Title/18 Medium, metadatos Caption/11 / Body/14 en text/secondary-3, y la
 *    calificación de la comunidad (18/24 Bold + StarRating; "N valoraciones" solo en escritorio).
 */
export function MusicHero({ kind, title, subtitle, meta, imageUrl, backdropUrl, shape = 'square', ratings }: MusicHeroProps) {
  const backdrop = backdropUrl === undefined ? imageUrl : backdropUrl
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded'
  return (
    <section aria-label={`${kind.toLowerCase()} ${title}`} className="flex w-full flex-col overflow-hidden rounded-lg bg-surface-input-disabled">
      <div aria-hidden="true" className="relative h-[171px] w-full overflow-hidden md:h-[304px]">
        {backdrop !== null && (
          <img src={backdrop} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-16 blur-[20px]" />
        )}
      </div>
      <div className="flex w-full items-center gap-4 p-4 md:gap-8 md:p-8">
        <span className={cn('block size-[136px] shrink-0 overflow-hidden bg-line md:size-60', radius)}>
          {imageUrl !== null && <img src={imageUrl} alt="" className="size-full object-cover" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2 leading-[1.4] md:gap-3">
          <p className="text-[11px] font-semibold text-fg">{kind}</p>
          <h1 className="text-2xl leading-[1.4] font-bold break-words text-fg md:text-[56px]">{title}</h1>
          <div className="text-[13px] font-medium text-fg md:text-lg">{subtitle}</div>
          {meta !== '' && <p className="text-[11px] text-fg-soft md:text-sm">{meta}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {ratings.average !== null ? (
              <>
                <span className="text-lg font-bold text-fg md:text-2xl">{formatRating(ratings.average)}</span>
                <span className="md:hidden">
                  <StarRating value={ratings.average} size="sm" />
                </span>
                <span className="hidden md:block">
                  <StarRating value={ratings.average} size="lg" />
                </span>
                <span className="hidden text-xs text-fg-soft md:inline">{valoraciones(ratings.count)}</span>
              </>
            ) : (
              <span className="text-xs text-fg-soft">Sin valoraciones todavía</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function valoraciones(count: number): string {
  return count === 1 ? '1 valoración' : `${formatCount(count)} valoraciones`
}

interface MusicActionsProps {
  /** Escribir Reseña; `null` mientras no exista la pantalla. */
  reviewTo: string | null
  /** Enlace de Spotify; `null` si el elemento no tiene ID de Spotify. */
  spotifyHref: string | null
  shareTitle: string
  /** Reproducir en Junkbox (solo la ficha de canción). No está en Figma: aprobado por el propietario, 2026-11-13. */
  onPlay?: () => void
  playLabel?: string
}

/**
 * MusicActions (Figma): "Calificar / Reseñar" (Button · Review, action/background-2), "Reproducir
 * en Spotify" (SpotifyButton · OpenSpotify: "Abre el contenido musical en Spotify. No crea una
 * cuenta ni inicia sesión") y compartir (share-2 20, solo escritorio). 220 px cada botón en
 * escritorio; mitad y mitad en móvil.
 */
export function MusicActions({ reviewTo, spotifyHref, shareTitle, onPlay, playLabel }: MusicActionsProps) {
  const [shared, setShared] = useState<string | null>(null)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShared('Enlace copiado')
    } catch {
      setShared(null)
    }
  }

  const buttonBase =
    'flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 leading-[1.4] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg md:w-[220px] md:flex-none'

  return (
    <div className="flex w-full items-center gap-3">
      {onPlay && (
        // Círculo de 44 con el "play" de QuickPlay: mismo alto que los botones de la fila.
        <button
          type="button"
          onClick={onPlay}
          aria-label={playLabel ?? 'Reproducir'}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <MaskIcon src={play14Icon} size={18} className="bg-on-action" />
        </button>
      )}
      {reviewTo !== null ? (
        <Link to={reviewTo} className={cn(buttonBase, 'border border-action bg-action text-sm text-on-action')}>
          Calificar / Reseñar
        </Link>
      ) : (
        <button
          type="button"
          aria-disabled="true"
          title="Disponible en el siguiente paso"
          className={cn(buttonBase, 'cursor-default border border-action bg-action text-sm text-on-action opacity-60')}
        >
          Calificar / Reseñar
        </button>
      )}
      {spotifyHref !== null ? (
        <a
          href={spotifyHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonBase, 'bg-surface-input-disabled text-xs text-fg')}
        >
          <img src={spotifyLogo} alt="" width={20} height={20} className="size-5 shrink-0 object-cover" />
          {onPlay ? (
            // Con el botón de reproducir, en móvil no cabe el texto completo.
            <>
              <span className="md:hidden">Spotify</span>
              <span className="hidden md:inline">Reproducir en Spotify</span>
            </>
          ) : (
            'Reproducir en Spotify'
          )}
        </a>
      ) : (
        <span aria-disabled="true" className={cn(buttonBase, 'bg-surface-input-disabled text-xs text-fg-placeholder')}>
          <img src={spotifyLogo} alt="" width={20} height={20} className="size-5 shrink-0 object-cover opacity-50" />
          No disponible en Spotify
        </span>
      )}
      <button
        type="button"
        onClick={share}
        aria-label="Compartir"
        className="hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-fg md:flex"
      >
        <MaskIcon src={share2Icon} size={20} className="bg-fg" />
      </button>
      <span aria-live="polite" className="hidden text-xs text-fg-placeholder md:inline">
        {shared}
      </span>
    </div>
  )
}

export function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 leading-[1.4]">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {aside}
    </div>
  )
}

/**
 * RatingDistribution · "La comunidad opina" (Figma): promedio Heading/36, StarRating 76×12 y
 * "sobre 5 estrellas". Las barras por estrella se omiten: el backend no da el reparto (RATE-01,
 * decisión del propietario).
 */
export function CommunityRating({
  ratings,
  mine = null,
  editTo,
}: {
  ratings: RatingSummary
  /** Mi calificación, si ya voté. */
  mine?: number | null
  /** Escribir Reseña del elemento, para cambiarla. */
  editTo?: string
}) {
  return (
    <section aria-label="La comunidad opina" className="flex w-full flex-col gap-3">
      <SectionHeader title="La comunidad opina" aside={<p className="text-xs text-fg-placeholder">{valoraciones(ratings.count)}</p>} />
      {ratings.average !== null ? (
        <div className="flex flex-col items-start gap-1 leading-[1.4]">
          <p className="text-4xl font-bold text-fg">{formatRating(ratings.average)}</p>
          <StarRating value={ratings.average} size="sm" />
          <p className="text-[11px] text-fg-placeholder">sobre 5 estrellas</p>
        </div>
      ) : (
        <p className="text-sm leading-[1.4] text-fg-muted">Nadie lo ha calificado todavía. ¡Sé el primero!</p>
      )}
      {mine !== null && (
        <p className="flex flex-wrap items-center gap-2 text-sm leading-[1.4] text-fg">
          Tu calificación: <strong className="font-semibold">{formatRating(mine)}</strong>
          <StarRating value={mine} size="sm" />
          {editTo && (
            <Link to={editTo} className="rounded text-xs text-link underline focus-visible:outline-2 focus-visible:outline-fg">
              Cambiar
            </Link>
          )}
        </p>
      )}
    </section>
  )
}

/** Esqueleto de la ficha mientras carga el dato principal. */
export function DetailSkeleton() {
  return (
    <div aria-busy="true" className="flex w-full flex-col gap-4 md:gap-5">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true" className="h-[357px] w-full rounded-lg bg-surface-input-disabled motion-safe:animate-pulse md:h-[608px]" />
      <div aria-hidden="true" className="h-11 w-full rounded-lg bg-surface-input-disabled motion-safe:animate-pulse md:w-[452px]" />
    </div>
  )
}

/** Error o "no encontrado" de la ficha. */
export function DetailError({ message, notFound, what, onRetry }: { message: string; notFound: boolean; what: string; onRetry: () => void }) {
  return (
    <div className="flex w-full flex-col items-start gap-3 md:max-w-[600px]">
      {notFound ? (
        <>
          <h1 className="text-2xl leading-[1.4] font-bold text-fg">No encontramos {what}</h1>
          <p className="text-sm leading-[1.4] text-fg-muted">Puede que el enlace no sea correcto. Búscalo en el Buscador.</p>
          <Link to={SEARCH_PATH} className="text-sm font-medium text-link underline">
            Ir al Buscador
          </Link>
        </>
      ) : (
        <>
          <FormAlert message={message} />
          <SecondaryButton label="Reintentar" onClick={onRetry} />
        </>
      )}
    </div>
  )
}
