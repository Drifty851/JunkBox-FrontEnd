import { useHomeController } from '../controllers/useHomeController'
import { RecommendationsSection } from './RecommendationsSection'

/**
 * Inicio · Figma: móvil 14244:50321 (claro) / 14263:21466 (oscuro),
 * escritorio 14244:50496 (claro) / 14263:21659 (oscuro).
 *
 * Base del módulo: muestra solo lo que tiene contrato de API. Las tabs "Para ti (Popular)" /
 * "Siguiendo" con ReviewCard, "Conecta por lo que suena" y el MiniPlayer se añadirán cuando
 * existan sus endpoints (implementacion.md · Inicio · Limitaciones conocidas).
 *
 * Escritorio: SocialFeed de 1280 centrado (márgenes 80, arriba 32) con FeedTimeline a la
 * izquierda y RecommendationsSidebar de 344 a la derecha (separación 48).
 * Móvil: contenido con márgenes 16, arriba 12; las recomendaciones van primero.
 */
export function HomePage() {
  const { recommendations, retry } = useHomeController()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pt-3 pb-4 md:flex-row md:items-start md:gap-12 md:px-8 md:pt-8 md:pb-8 xl:px-20">
      {/* FeedTimeline: de momento solo la introducción (Feed introduction, 14244:50525). */}
      <div className="flex min-w-0 flex-col gap-1 md:flex-1">
        <h1 className="sr-only text-heading leading-[1.4] font-bold text-fg md:not-sr-only">
          Recomendados para ti
        </h1>
        <p className="hidden text-sm leading-[1.4] text-fg-placeholder md:block">
          Aquí encontrarás recomendaciones de artistas, canciones y podcasts que podrían interesarte.
        </p>
      </div>

      <aside className="order-first md:order-none md:w-[344px] md:shrink-0">
        <RecommendationsSection state={recommendations} onRetry={retry} />
      </aside>
    </div>
  )
}
