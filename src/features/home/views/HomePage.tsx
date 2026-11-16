import { useHomeController } from '../controllers/useHomeController'
import { HomeFeed } from './HomeFeed'
import { RecommendationsSection } from './RecommendationsSection'

/**
 * Inicio · Figma: móvil 14244:50321 (claro) / 14263:21466 (oscuro),
 * escritorio 14244:50496 (claro) / 14263:21659 (oscuro).
 *
 * Mientras no existan HOME-01 ni HOME-04, todo sale de la lista de prueba (decisión del
 * propietario, 2026-11-15): recomendaciones al azar y un feed con reseñas reales de los usuarios
 * de prueba. "Conecta por lo que suena" sigue pendiente (HOME-05).
 *
 * Escritorio: SocialFeed de 1280 centrado (márgenes 80, arriba 32) con FeedTimeline a la
 * izquierda y RecommendationsSidebar de 344 a la derecha (separación 48).
 * Móvil: contenido con márgenes 16, arriba 12; las recomendaciones van primero.
 */
export function HomePage() {
  const { recommendations, tab, selectTab, feed, retryFeed } = useHomeController()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pt-3 pb-4 md:flex-row md:items-start md:gap-12 md:px-8 md:pt-8 md:pb-8 xl:px-20">
      <div className="flex min-w-0 flex-col gap-6 md:flex-1">
        {/* Feed introduction (14244:50525). */}
        <div className="flex flex-col gap-1">
          <h1 className="sr-only text-heading leading-[1.4] font-bold text-fg md:not-sr-only">Recomendados para ti</h1>
          <p className="hidden text-sm leading-[1.4] text-fg-placeholder md:block">
            Aquí encontrarás recomendaciones de artistas, canciones y podcasts que podrían interesarte.
          </p>
        </div>
        <HomeFeed tab={tab} onSelectTab={selectTab} feed={feed} onRetry={retryFeed} />
      </div>

      <aside className="order-first md:order-none md:w-[344px] md:shrink-0">
        <RecommendationsSection items={recommendations} />
      </aside>
    </div>
  )
}
