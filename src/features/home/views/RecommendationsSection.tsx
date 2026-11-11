import { FormAlert } from '../../../shared/ui/FormAlert'
import { MusicCard } from '../../../shared/ui/MusicCard'
import type { RecommendationsState } from '../controllers/useHomeController'
import { songPath } from '../../catalog/models/catalogPaths'

interface RecommendationsSectionProps {
  state: RecommendationsState
  onRetry: () => void
}

/** Escritorio muestra 2×2 (Figma · RecommendationsSidebar); móvil, todas en el carrusel. */
const LIST_CLASSES =
  '-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-[repeat(2,164px)] md:gap-x-4 md:gap-y-6 md:overflow-visible md:px-0'
const ITEM_CLASSES = 'shrink-0 md:nth-[n+5]:hidden'
const SKELETON_COUNT = 4

/**
 * "Hecho para tus oídos" (Figma · Recommendations, móvil 14244:50349 / escritorio 14244:50642).
 * Estados de carga, error y vacío: Figma no los define. Se usan la geometría de MusicCard
 * (carga) y FormAlert (error) para no inventar estilos nuevos.
 */
export function RecommendationsSection({ state, onRetry }: RecommendationsSectionProps) {
  return (
    <section aria-labelledby="home-recommendations-title" className="flex flex-col gap-3 md:gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="home-recommendations-title" className="text-lg leading-[1.4] font-semibold text-fg">
          Hecho para tus oídos
        </h2>
        {/* "Ver todo": aún no hay pantalla de recomendaciones. Sin acción, como el resto de destinos pendientes. */}
        <button
          type="button"
          aria-disabled="true"
          onClick={(event) => event.preventDefault()}
          className="cursor-default text-xs leading-[1.4] whitespace-nowrap text-fg-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Ver todo
        </button>
      </div>

      {state.status === 'loading' && (
        <ul aria-busy="true" className={LIST_CLASSES}>
          <li className="sr-only">Cargando recomendaciones…</li>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <li key={index} aria-hidden="true" className={ITEM_CLASSES}>
              <div className="flex w-28 flex-col gap-1 md:w-[164px]">
                <div className="size-28 rounded bg-surface-input-disabled motion-safe:animate-pulse md:size-[164px]" />
                <div className="h-[18px] w-3/4 rounded bg-surface-input-disabled motion-safe:animate-pulse md:h-5" />
                <div className="h-[15px] w-1/2 rounded bg-surface-input-disabled motion-safe:animate-pulse md:h-[17px]" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-2">
          <FormAlert message={state.message} />
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === 'ready' && state.tracks.length === 0 && (
        <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay recomendaciones.</p>
      )}

      {state.status === 'ready' && state.tracks.length > 0 && (
        <ul className={LIST_CLASSES}>
          {state.tracks.map((track) => (
            <li key={track.spotifyId} className={ITEM_CLASSES}>
              <MusicCard
                title={track.title}
                artist={track.artist}
                kind="Canción"
                imageUrl={track.imageUrl}
                to={songPath(track.spotifyId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
