import { request } from '../../../shared/api/httpClient'
import type {
  CreateReviewRequest,
  RateRequest,
  Rating,
  Review,
  ReviewPage,
  ReviewTargetType,
  UpdateReviewRequest,
} from '../models/review.types'

const targetQuery = (type: ReviewTargetType, id: string) =>
  new URLSearchParams({ target_type: type, target_id: id }).toString()

/**
 * Adaptador de /api/v1/ratings y /api/v1/reviews (backend handlers_ratings.go y
 * handlers_reviews.go). Todo con Bearer. Errores: 400 validación · 401 · 403 recurso de otro
 * usuario · 404 objetivo o recurso inexistente · 409 reseña duplicada.
 */
export const reviewsApi = {
  /** POST /ratings → 201/200 Rating. Votar de nuevo reemplaza el puntaje. */
  rate(body: RateRequest, accessToken: string): Promise<Rating> {
    return request<Rating>('/ratings', { method: 'POST', body, accessToken })
  },

  /** GET /ratings/my → 200 Rating · 404 si el usuario no ha votado. */
  getMyRating(type: ReviewTargetType, id: string, accessToken: string, signal?: AbortSignal): Promise<Rating> {
    return request<Rating>(`/ratings/my?${targetQuery(type, id)}`, { accessToken, signal })
  },

  /** DELETE /ratings/{id} → 200 { message }. */
  deleteRating(id: string, accessToken: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/ratings/${encodeURIComponent(id)}`, { method: 'DELETE', accessToken })
  },

  /** GET /reviews?target… → 200 ReviewPage (de la más reciente a la más antigua). `limit` 1..50. */
  listReviews(
    params: { type: ReviewTargetType; id: string; limit?: number; page?: number },
    accessToken: string,
    signal?: AbortSignal,
  ): Promise<ReviewPage> {
    const query = new URLSearchParams({ target_type: params.type, target_id: params.id })
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.page !== undefined) query.set('page', String(params.page))
    return request<ReviewPage>(`/reviews?${query.toString()}`, { accessToken, signal })
  },

  /** GET /reviews/{id} → 200 Review · 404 si no existe · 400 si el id no es un UUID. */
  getReview(id: string, accessToken: string, signal?: AbortSignal): Promise<Review> {
    return request<Review>(`/reviews/${encodeURIComponent(id)}`, { accessToken, signal })
  },

  /** POST /reviews → 201 Review · 409 si el usuario ya reseñó ese objetivo. */
  createReview(body: CreateReviewRequest, accessToken: string): Promise<Review> {
    return request<Review>('/reviews', { method: 'POST', body, accessToken })
  },

  /** PUT /reviews/{id} → 200 Review (reemplaza título y contenido). */
  updateReview(id: string, body: UpdateReviewRequest, accessToken: string): Promise<Review> {
    return request<Review>(`/reviews/${encodeURIComponent(id)}`, { method: 'PUT', body, accessToken })
  },

  /** DELETE /reviews/{id} → 200 { message }. */
  deleteReview(id: string, accessToken: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE', accessToken })
  },
}
