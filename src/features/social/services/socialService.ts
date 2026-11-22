import { authService } from '../../auth/services/authService'
import { socialApi } from '../infrastructure/socialApi'
import type { ConnectionKind, ConnectionsPage, FeedPage, FeedTab, LikeResult, PublicProfile, UserSuggestion } from '../models/social.types'

const call = <T>(request: (token: string) => Promise<T>) => authService.withAccessToken(request)

/** Reseñas por página del feed (backend: 1..50, por defecto 20). */
const FEED_PAGE_SIZE = 20
/** Personas por página de seguidores y seguidos. */
const CONNECTIONS_PAGE_SIZE = 20

/**
 * Zona horaria del navegador: "Para ti" agrupa las reseñas por día en esa zona. Si el navegador
 * no la da, el backend usa America/Mazatlan.
 */
function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

/** Casos de uso sociales (HOME-04, HOME-05). */
export const socialService = {
  /** Una página del feed. Sin `cursor`, la primera. */
  getFeedPage(tab: FeedTab, cursor: string | null, signal?: AbortSignal): Promise<FeedPage> {
    const timezone = tab === 'popular' ? browserTimezone() : undefined
    return call((token) => socialApi.getFeed({ tab, timezone, limit: FEED_PAGE_SIZE, cursor }, token, signal))
  },

  /** Usuarios sugeridos ("Conecta por lo que suena"). */
  async getSuggestions(limit: number, signal?: AbortSignal): Promise<UserSuggestion[]> {
    const page = await call((token) => socialApi.getSuggestions(limit, token, signal))
    return page.users
  },

  /** Perfil público de una persona (por username o id). */
  getProfile(idOrUsername: string, signal?: AbortSignal): Promise<PublicProfile> {
    return call((token) => socialApi.getProfile(idOrUsername, token, signal))
  },

  /** Una página de seguidores o seguidos. Sin `cursor`, la primera. */
  getConnectionsPage(idOrUsername: string, kind: ConnectionKind, cursor: string | null, signal?: AbortSignal): Promise<ConnectionsPage> {
    return call((token) => socialApi.getConnections(idOrUsername, kind, { limit: CONNECTIONS_PAGE_SIZE, cursor }, token, signal))
  },

  /** Seguir o dejar de seguir a una persona. */
  setFollowing(userId: string, follow: boolean): Promise<PublicProfile> {
    return call((token) => socialApi.setFollowing(userId, follow, token))
  },

  /** Dar o quitar Me gusta a una reseña. */
  setLiked(reviewId: string, like: boolean): Promise<LikeResult> {
    return call((token) => socialApi.setLiked(reviewId, like, token))
  },
}
