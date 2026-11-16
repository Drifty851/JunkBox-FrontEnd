import { ApiError } from '../../../shared/api/httpClient'
import { reviewsService } from '../../reviews/services/reviewsService'
import { DEMO_POOL } from '../data/demoPool'
import { byPopularity, sampleRandom, type DemoTarget, type FeedReview } from '../models/home.types'

/** Objetivos reseñados que se consultan por carga, y reseñas de cada uno. */
const FEED_TARGETS = 8
const REVIEWS_PER_TARGET = 3
/** Reseñas que muestra el feed. */
export const FEED_SIZE = 10

/**
 * Casos de uso de Inicio. Hasta HOME-01 y HOME-04 todo sale de la lista de prueba (DEMO_POOL),
 * elegido al azar en cada carga (decisión del propietario, 2026-11-15).
 */
export const homeService = {
  /** "Hecho para tus oídos" y "Ver todo": canciones, álbumes y artistas al azar. */
  pickRecommendations(count: number): DemoTarget[] {
    // El catálogo tiene alguna canción repetida con otro ID ("Da Funk"): se muestra una sola vez.
    const seen = new Set<string>()
    return sampleRandom(DEMO_POOL, DEMO_POOL.length)
      .filter((target) => {
        const key = `${target.type}:${target.title.toLocaleLowerCase('es')}:${target.subtitle}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, count)
  },

  /**
   * "Para ti (Popular)": las reseñas reales (GET /reviews) de objetivos reseñados elegidos al
   * azar, ordenadas por popularidad. Un objetivo que falle se omite; si fallan todos, se propaga
   * el primer error (un 401 siempre, para cerrar la sesión).
   */
  async loadFeed(signal?: AbortSignal): Promise<FeedReview[]> {
    const targets = sampleRandom(
      DEMO_POOL.filter((target) => target.reviewed),
      FEED_TARGETS,
    )
    const results = await Promise.allSettled(
      targets.map(async (target) => {
        const page = await reviewsService.listForTarget(target.type, target.id, REVIEWS_PER_TARGET, signal)
        return page.reviews.map((review) => ({ review, target }))
      }),
    )
    const feed: FeedReview[] = []
    const failures: unknown[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') feed.push(...result.value)
      else failures.push(result.reason)
    }
    const unauthorized = failures.find((error) => error instanceof ApiError && error.status === 401)
    if (unauthorized) throw unauthorized
    if (feed.length === 0 && failures.length > 0) throw failures[0]
    return sampleRandom(feed, feed.length).sort(byPopularity).slice(0, FEED_SIZE)
  },
}
