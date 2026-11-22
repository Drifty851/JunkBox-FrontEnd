import { useParams, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/controllers/authContext'
import { useLoad } from '../../catalog/controllers/useLoad'
import { useFollow } from '../../social/controllers/socialContext'
import type { PublicProfile } from '../../social/models/social.types'
import { socialService } from '../../social/services/socialService'
import { PROFILE_TAB_PARAM, tabFromParam, type ProfileStats, type ProfileTab, type RatingSummaryStats } from '../models/profile'

/** Sin endpoint para el resumen de calificaciones (PROF-03): plantilla con "—". */
const EMPTY_SUMMARY: RatingSummaryStats = { average: null, fiveStars: null }

const loadProfile = (username: string, signal: AbortSignal) => socialService.getProfile(username, signal)

/**
 * Controlador del perfil: el mío (`/perfil`) o el de otra persona (`/usuario/:username`; si es el
 * mío, la vista redirige a `/perfil`). Desde el 2026-11-19 los dos cargan GET /users/{username}:
 * Seguidores, Seguidos y Reseñas son reales; Calificaciones y el resumen siguen en "—" (PROF-03).
 * En el perfil de otra persona, Seguir usa el estado compartido (`useFollow`) y el contador de
 * Seguidores se ajusta al momento. La pestaña activa vive en la URL (`?tab=calificaciones`).
 */
export function useProfileController() {
  const { user } = useAuth()
  const { username } = useParams()
  const isOwn = !username || username === user?.username
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  // Mi perfil se pide por id: el username puede no servir en la URL (cuentas antiguas con espacios
  // o mayúsculas, que el backend ya no admite al registrar; encontrado el 2026-11-19).
  const lookup = isOwn ? (user?.id ?? null) : (username ?? null)
  const [profile, retryProfile] = useLoad(lookup, loadProfile)
  const data: PublicProfile | null = profile.status === 'ready' ? profile.data : null

  // Hooks siempre en el mismo orden: sin perfil todavía, el id vacío no corresponde a nadie.
  const follow = useFollow(data?.id ?? '', data?.followed_by_me ?? false)
  const followDelta = data ? Number(follow.following) - Number(data.followed_by_me) : 0

  const stats: ProfileStats = {
    reviews: data?.reviews_count ?? null,
    ratings: null,
    followers: data ? Math.max(0, data.followers_count + followDelta) : null,
    following: data?.following_count ?? null,
  }

  function selectTab(next: ProfileTab) {
    if (next === tab) return
    const value = PROFILE_TAB_PARAM[next]
    setParams(value ? { tab: value } : {})
  }

  return {
    user,
    username: username ?? null,
    isOwn: isOwn || data?.is_me === true,
    tab,
    selectTab,
    profile,
    retryProfile,
    follow,
    stats,
    summary: EMPTY_SUMMARY,
  }
}
