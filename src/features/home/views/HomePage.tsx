import { useLocation } from 'react-router'
import { reselectToken } from '../../../shared/layout/reselect'
import { useHomeController } from '../controllers/useHomeController'
import { CommunitySuggestion } from './CommunitySuggestion'
import { HomeFeed } from './HomeFeed'
import { RecommendationsSection } from './RecommendationsSection'

/**
 * Inicio · Figma: móvil 14244:50321 (claro) / 14263:21466 (oscuro),
 * escritorio 14244:50496 (claro) / 14263:21659 (oscuro).
 *
 * Datos del backend: recomendaciones (GET /home, HOME-01), feed (GET /feed, HOME-04) y
 * sugerencias de usuarios (GET /users/suggestions, HOME-05, solo escritorio).
 *
 * Escritorio: SocialFeed de 1280 centrado (márgenes 80, arriba 32) con FeedTimeline a la
 * izquierda y RecommendationsSidebar de 344 a la derecha (separación 48); en la barra lateral,
 * "Hecho para tus oídos" y "Conecta por lo que suena" separados 24.
 * Móvil: contenido con márgenes 16, arriba 12; las recomendaciones van primero.
 *
 * Volver a pulsar el logo, "Inicio" o la BottomBar estando aquí reinicia la pantalla
 * (2026-11-19): la marca de `location.state` es la `key`, así que todo se vuelve a pedir.
 */
export function HomePage() {
  const { state } = useLocation()
  return <HomeContent key={reselectToken(state)} />
}

function HomeContent() {
  const { recommendations, retryRecommendations, suggestions, tab, selectTab, feed, loadMoreFeed, retryFeed } = useHomeController()

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
        <HomeFeed tab={tab} onSelectTab={selectTab} feed={feed} onLoadMore={loadMoreFeed} onRetry={retryFeed} />
      </div>

      <aside className="order-first flex flex-col gap-6 md:order-none md:w-[344px] md:shrink-0">
        <RecommendationsSection state={recommendations} onRetry={retryRecommendations} />
        <CommunitySuggestion suggestions={suggestions} />
      </aside>
    </div>
  )
}
