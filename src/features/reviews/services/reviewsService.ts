import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { reviewsApi } from '../infrastructure/reviewsApi'
import type { Rating, Review, ReviewPage, ReviewTargetType } from '../models/review.types'

const call = <T>(request: (token: string) => Promise<T>) => authService.withAccessToken(request)

/** Página máxima del backend (GET /reviews: `limit` 1..50). */
const MAX_PAGE = 50

/** Casos de uso de reseñas y calificaciones (backend commit 6d77d4d, implementacion.md §6). */
export const reviewsService = {
  /** Una reseña por su id (GET /reviews/{id}). */
  get(id: string, signal?: AbortSignal): Promise<Review> {
    return call((token) => reviewsApi.getReview(id, token, signal))
  },

  /** Reseñas más recientes de un objetivo (GET /reviews). */
  listForTarget(type: ReviewTargetType, id: string, limit: number, signal?: AbortSignal): Promise<ReviewPage> {
    return call((token) => reviewsApi.listReviews({ type, id, limit }, token, signal))
  },

  /** Mi calificación del objetivo, o null si no he votado (GET /ratings/my → 404). */
  async getMyRating(type: ReviewTargetType, id: string, signal?: AbortSignal): Promise<Rating | null> {
    try {
      return await call((token) => reviewsApi.getMyRating(type, id, token, signal))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  /**
   * Mi reseña del objetivo, o null. No hay GET /reviews/my (REV-02): se recorren las páginas
   * de GET /reviews (50 por página) buscando el autor.
   */
  async findMyReview(type: ReviewTargetType, id: string, userId: string, signal?: AbortSignal): Promise<Review | null> {
    for (let page = 1; ; page++) {
      const result = await call((token) => reviewsApi.listReviews({ type, id, limit: MAX_PAGE, page }, token, signal))
      const mine = result.reviews.find((review) => review.author.id === userId)
      if (mine) return mine
      if (page * MAX_PAGE >= result.total || result.reviews.length === 0) return null
    }
  },

  /** Califica (o cambia la calificación): POST /ratings hace upsert. */
  rate(type: ReviewTargetType, id: string, score: number): Promise<Rating> {
    return call((token) => reviewsApi.rate({ target_type: type, target_id: id, score }, token))
  },

  deleteRating(ratingId: string): Promise<{ message: string }> {
    return call((token) => reviewsApi.deleteRating(ratingId, token))
  },

  /**
   * Publica o actualiza mi reseña. Con `existingId` hace PUT; si no, POST y, si el backend
   * responde 409 (ya había una), la busca y hace PUT.
   */
  async saveReview(type: ReviewTargetType, id: string, content: string, existingId: string | null, userId: string): Promise<Review> {
    if (existingId) return call((token) => reviewsApi.updateReview(existingId, { content }, token))
    try {
      return await call((token) => reviewsApi.createReview({ target_type: type, target_id: id, content }, token))
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error
      const mine = await reviewsService.findMyReview(type, id, userId)
      if (!mine) throw error
      return call((token) => reviewsApi.updateReview(mine.id, { content }, token))
    }
  },

  deleteReview(reviewId: string): Promise<{ message: string }> {
    return call((token) => reviewsApi.deleteReview(reviewId, token))
  },
}
