import { request } from '../../../shared/api/httpClient'
import type { FeedPage, FeedTab, SuggestionPage } from '../models/social.types'

/**
 * Adaptador de las rutas sociales del backend (handlers_social.go). Todo con Bearer.
 * Errores: 400 parámetro inválido (tab, tz, cursor, limit) · 401.
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
}
