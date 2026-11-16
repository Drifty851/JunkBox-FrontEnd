/**
 * Contrato de calificaciones y reseñas del backend (commit 6d77d4d).
 * Fuente: dto/review_dto.go, README del backend (endpoints 15–22) e implementacion.md §6.
 */

export type ReviewTargetType = 'song' | 'album' | 'artist'

/** Objetivo tal como lo devuelve el backend: siempre con el id LOCAL. */
export interface ReviewTarget {
  type: ReviewTargetType
  id: string
}

/** POST /ratings → 201 (nuevo) / 200 (reemplazado) · GET /ratings/my → 200 · 404 si no votó. */
export interface Rating {
  id: string
  user_id: string
  target: ReviewTarget
  /** De 0.5 a 5.0 en pasos de 0.5. */
  score: number
  created_at: string
  updated_at: string
}

export interface RateRequest {
  target_type: ReviewTargetType
  /** Acepta el id local o el ID de Spotify. */
  target_id: string
  score: number
}

export interface ReviewAuthor {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export interface Review {
  id: string
  target: ReviewTarget
  title: string | null
  content: string
  /** Voto ACTUAL del autor sobre el mismo objetivo; null si no tiene. */
  rating_score: number | null
  /** Reservado: siempre 0 (LIKE-01). */
  likes_count: number
  author: ReviewAuthor
  created_at: string
  updated_at: string
}

/** GET /reviews?target_type&target_id&limit&page → 200. */
export interface ReviewPage {
  target: ReviewTarget
  page: number
  limit: number
  /** Reseñas de esta página. */
  count: number
  /** Todas las del objetivo. */
  total: number
  reviews: Review[]
}

export interface CreateReviewRequest {
  target_type: ReviewTargetType
  target_id: string
  title?: string
  /** De 5 a 5000 caracteres. */
  content: string
}

export interface UpdateReviewRequest {
  title?: string
  content: string
}
