import { Link } from 'react-router'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { MusicCard } from '../../../shared/ui/MusicCard'
import { songPath } from '../../catalog/models/catalogPaths'
import type { LoadState } from '../../catalog/controllers/useLoad'
import { usePlayer } from '../../player/controllers/playerContext'
import { RECOMMENDATIONS_PATH, type HomeItem } from '../models/home.types'

/** Escritorio muestra 2×2 (Figma · RecommendationsSidebar); móvil, todas en el carrusel. */
const LIST_CLASSES =
  '-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-[repeat(2,164px)] md:gap-x-4 md:gap-y-6 md:overflow-visible md:px-0'
const ITEM_CLASSES = 'shrink-0 md:nth-[n+5]:hidden'

/**
 * "Hecho para tus oídos" (Figma · Recommendations, móvil 14244:50349 / escritorio 14244:50642).
 * Canciones de GET /home (HOME-01): parecidas a lo último que el usuario calificó o reseñó, o las
 * más populares si aún no tiene actividad. QuickPlay reproduce la canción y la tarjeta abre su
 * ficha. "Ver todo" abre /recomendaciones.
 */
export function RecommendationsSection({ state, onRetry }: { state: LoadState<HomeItem[]>; onRetry: () => void }) {
  const { play } = usePlayer()
  return (
    <section aria-labelledby="home-recommendations-title" aria-busy={state.status === 'loading'} className="flex flex-col gap-3 md:gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="home-recommendations-title" className="text-lg leading-[1.4] font-semibold text-fg">
          Hecho para tus oídos
        </h2>
        <Link
          to={RECOMMENDATIONS_PATH}
          className="rounded text-xs leading-[1.4] whitespace-nowrap text-fg-placeholder hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Ver todo
        </Link>
      </div>

      {state.status === 'ready' ? (
        state.data.length === 0 ? (
          <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay recomendaciones.</p>
        ) : (
          <ul className={LIST_CLASSES}>
            {state.data.map((item) => (
              <li key={item.id} className={ITEM_CLASSES}>
                <MusicCard
                  title={item.track_name}
                  artist={item.artist_name}
                  kind="Canción"
                  imageUrl={item.album_image_url}
                  to={songPath(item.spotify_id)}
                  onPlay={() => play(item.spotify_id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : state.status === 'error' ? (
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
      ) : (
        <>
          <p className="sr-only">Cargando recomendaciones…</p>
          <ul aria-hidden="true" className={LIST_CLASSES}>
            {[0, 1, 2, 3].map((index) => (
              <li key={index} className={ITEM_CLASSES}>
                <div className="size-28 rounded bg-surface-input-disabled motion-safe:animate-pulse md:size-41" />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
