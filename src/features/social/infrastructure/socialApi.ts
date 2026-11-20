import { request } from '../../../shared/api/httpClient'
import type { FeedPage, FeedTab, LikeResult, PublicProfile, SuggestionPage } from '../models/social.types'

/**
 * Adaptador de las rutas sociales del backend (handlers_social.go). Todo con Bearer.
 * Errores: 400 parámetro inválido (tab, tz, cursor, limit) o seguirse a uno mismo · 401 · 404.
 */
export const socialApi = {
  /** GET /feed?tab=&tz=&limit=&cursor= → 200 FeedPage. `tz` solo aplica a `popular`. */
  getFeed(
    params: { tab: FeedTab; timezone?: string; limit?: number; cursor?: string | null },
    accessToken: string,
    signal?: AbortSignal,
  ): Promise<FeedPage> {
    const query = new URLSearchParams({ tab: params.tab })
    if (params.timezone) query.set('tz', params.timezone)
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.cursor) query.set('cursor', params.cursor)
    return request<FeedPage>(`/feed?${query.toString()}`, { accessToken, signal })
  },

  /** GET /users/suggestions?limit= → 200 SuggestionPage (`limit` 1..50). */
  getSuggestions(limit: number, accessToken: string, signal?: AbortSignal): Promise<SuggestionPage> {
    return request<SuggestionPage>(`/users/suggestions?limit=${limit}`, { accessToken, signal })
  },

  /** POST (seguir) o DELETE (dejar de seguir) /users/{id}/follow → 200 PublicProfile. Idempotente. */
  setFollowing(userId: string, follow: boolean, accessToken: string): Promise<PublicProfile> {
    return request<PublicProfile>(`/users/${encodeURIComponent(userId)}/follow`, { method: follow ? 'POST' : 'DELETE', accessToken })
  },

  /** POST (dar) o DELETE (quitar) /reviews/{id}/like → 200 LikeResult. Idempotente. */
  setLiked(reviewId: string, like: boolean, accessToken: string): Promise<LikeResult> {
    return request<LikeResult>(`/reviews/${encodeURIComponent(reviewId)}/like`, { method: like ? 'POST' : 'DELETE', accessToken })
  },
}
