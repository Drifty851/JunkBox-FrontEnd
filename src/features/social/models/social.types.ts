import type { Review, ReviewAuthor } from '../../reviews/models/review.types'

/**
 * Contrato del módulo social del backend (commits b2968e8 y 7523d54, HOME-04 y HOME-05).
 * Fuente: domain/social.go y README del backend (endpoints 24 y 28).
 */

/** Pestañas del feed: "Para ti (Popular)" y "Siguiendo". */
export type FeedTab = 'popular' | 'following'

/** GET /feed → 200. `next_cursor` null = última página. */
export interface FeedPage {
  tab: FeedTab
  /** Solo en `popular`. */
  timezone?: string
  limit: number
  next_cursor: string | null
  reviews: Review[]
}

export interface SuggestionArtist {
  id: string
  name: string
  image_url: string | null
}

/** Motivo de la sugerencia. `text` viene listo para mostrar ("También escucha Hoke"). */
export interface SuggestionReason {
  type: 'common_artists' | 'similar_taste' | 'popular'
  text: string
  common_count: number
  artists: SuggestionArtist[] | null
  similarity: number | null
}

export interface UserSuggestion extends ReviewAuthor {
  reason: SuggestionReason
}

/** GET /users/suggestions → 200. `computed_at` null si el usuario aún no tiene sugerencias propias. */
export interface SuggestionPage {
  limit: number
  computed_at: string | null
  users: UserSuggestion[]
}
