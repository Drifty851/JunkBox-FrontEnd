import { Link } from 'react-router'
import { MusicCard } from '../../../shared/ui/MusicCard'
import { usePlayer } from '../../player/controllers/playerContext'
import { KIND_LABEL, RECOMMENDATIONS_PATH, targetPath, type DemoTarget } from '../models/home.types'

/** Escritorio muestra 2×2 (Figma · RecommendationsSidebar); móvil, todas en el carrusel. */
const LIST_CLASSES =
  '-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-[repeat(2,164px)] md:gap-x-4 md:gap-y-6 md:overflow-visible md:px-0'
const ITEM_CLASSES = 'shrink-0 md:nth-[n+5]:hidden'

/**
 * "Hecho para tus oídos" (Figma · Recommendations, móvil 14244:50349 / escritorio 14244:50642).
 * Canciones, álbumes y artistas al azar de la lista de prueba en cada carga (2026-11-15, hasta
 * HOME-01). Solo las canciones tienen QuickPlay; álbumes y artistas abren su ficha.
 * "Ver todo" abre /recomendaciones.
 */
export function RecommendationsSection({ items }: { items: DemoTarget[] }) {
  const { play } = usePlayer()
  return (
    <section aria-labelledby="home-recommendations-title" className="flex flex-col gap-3 md:gap-6">
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

      {items.length === 0 ? (
        <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay recomendaciones.</p>
      ) : (
        <ul className={LIST_CLASSES}>
          {items.map((item) => (
            <li key={`${item.type}:${item.id}`} className={ITEM_CLASSES}>
              <MusicCard
                title={item.title}
                artist={item.type === 'artist' ? 'Artista' : item.subtitle.split(' · ')[0]}
                kind={KIND_LABEL[item.type]}
                imageUrl={item.imageUrl}
                to={targetPath(item)}
                onPlay={item.type === 'song' ? () => play(item.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
