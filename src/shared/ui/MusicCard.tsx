import play12Icon from '../../assets/icons/play-12.svg'
import play14Icon from '../../assets/icons/play-14.svg'
import { Link } from 'react-router'
import { MaskIcon } from './MaskIcon'

interface MusicCardProps {
  title: string
  artist: string
  /** Tipo de contenido ("Canción", "Álbum"). Figma solo lo muestra en móvil: "Artista · Canción". */
  kind: string
  /** Carátula. `null` muestra un recuadro neutro con la misma geometría. */
  imageUrl: string | null
  /** Ficha a la que lleva la tarjeta (toda la tarjeta es pulsable). */
  to?: string
  /** QuickPlay: reproduce la canción. Sin él, el QuickPlay es decorativo. */
  onPlay?: () => void
}

/**
 * Tarjeta musical (Figma · MusicCard).
 *  - Móvil (14296:3287): portada 112, título Body/13/SemiBold, subtítulo Caption/11, QuickPlay 28 con play 12.
 *  - Escritorio (14296:3195): portada 164, título Body/14/SemiBold, subtítulo Caption/12, QuickPlay 32 con play 14.
 * QuickPlay reproduce la canción si recibe `onPlay` (reproductor de Spotify); sin él no se muestra
 * (álbumes y artistas, 2026-11-15). Los textos largos se recortan
 * con puntos suspensivos (Figma no define el desbordamiento) y el texto completo queda en `title`.
 */
export function MusicCard({ title, artist, kind, imageUrl, to, onPlay }: MusicCardProps) {
  const quickPlayIcon = (
    <>
      {/* MaskIcon ya es inline-block: la visibilidad por tamaño se controla en el contenedor. */}
      <span className="flex md:hidden">
        <MaskIcon src={play12Icon} size={12} className="bg-fg" />
      </span>
      <span className="hidden md:flex">
        <MaskIcon src={play14Icon} size={14} className="bg-fg" />
      </span>
    </>
  )
  const quickPlayClass =
    'absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-surface-quickplay md:size-8'
  return (
    <article className="relative flex w-28 flex-col gap-1 md:w-[164px]">
      <div className="relative size-28 overflow-hidden rounded bg-surface-input-disabled md:size-[164px]">
        {imageUrl !== null && <img src={imageUrl} alt="" className="size-full object-cover" />}
        {onPlay ? (
          // z-[1]: por encima del enlace que cubre la tarjeta (after:inset-0) y por debajo de la Navbar.
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Reproducir ${title}`}
            className={`${quickPlayClass} z-[1] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg`}
          >
            {quickPlayIcon}
          </button>
        ) : null}
      </div>
      <h3 title={title} className="truncate text-[13px] leading-[1.4] font-semibold text-fg md:text-sm">
        {to ? (
          <Link
            to={to}
            className="rounded after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p title={artist === kind ? artist : `${artist} · ${kind}`} className="truncate text-[11px] leading-[1.4] text-fg-placeholder md:text-xs">
        {artist}
        {artist !== kind && <span className="md:hidden"> · {kind}</span>}
      </p>
    </article>
  )
}
