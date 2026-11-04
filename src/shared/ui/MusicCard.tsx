import play12Icon from '../../assets/icons/play-12.svg'
import play14Icon from '../../assets/icons/play-14.svg'
import { MaskIcon } from './MaskIcon'

interface MusicCardProps {
  title: string
  artist: string
  /** Tipo de contenido ("Canción", "Álbum"). Figma solo lo muestra en móvil: "Artista · Canción". */
  kind: string
  /** Carátula. `null` muestra un recuadro neutro con la misma geometría. */
  imageUrl: string | null
}

/**
 * Tarjeta musical (Figma · MusicCard).
 *  - Móvil (14296:3287): portada 112, título Body/13/SemiBold, subtítulo Caption/11, QuickPlay 28 con play 12.
 *  - Escritorio (14296:3195): portada 164, título Body/14/SemiBold, subtítulo Caption/12, QuickPlay 32 con play 14.
 * QuickPlay es decorativo hasta que haya reproducción de audio. Los textos largos se recortan
 * con puntos suspensivos (Figma no define el desbordamiento) y el texto completo queda en `title`.
 */
export function MusicCard({ title, artist, kind, imageUrl }: MusicCardProps) {
  return (
    <article className="flex w-28 flex-col gap-1 md:w-[164px]">
      <div className="relative size-28 overflow-hidden rounded bg-surface-input-disabled md:size-[164px]">
        {imageUrl !== null && <img src={imageUrl} alt="" className="size-full object-cover" />}
        <span
          aria-hidden="true"
          className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-surface-quickplay md:size-8"
        >
          {/* MaskIcon ya es inline-block: la visibilidad por tamaño se controla en el contenedor. */}
          <span className="flex md:hidden">
            <MaskIcon src={play12Icon} size={12} className="bg-fg" />
          </span>
          <span className="hidden md:flex">
            <MaskIcon src={play14Icon} size={14} className="bg-fg" />
          </span>
        </span>
      </div>
      <h3 title={title} className="truncate text-[13px] leading-[1.4] font-semibold text-fg md:text-sm">
        {title}
      </h3>
      <p title={`${artist} · ${kind}`} className="truncate text-[11px] leading-[1.4] text-fg-placeholder md:text-xs">
        {artist}
        <span className="md:hidden"> · {kind}</span>
      </p>
    </article>
  )
}
