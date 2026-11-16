import { useSearchParams } from 'react-router'
import { useAuth } from '../../auth/controllers/authContext'
import { PROFILE_TAB_PARAM, tabFromParam, type ProfileStats, type ProfileTab, type RatingSummaryStats } from '../models/profile'

/** Sin endpoints para contarlos (PROF-03): plantilla con "—". */
const EMPTY_STATS: ProfileStats = { reviews: null, ratings: null, followers: null, following: null }
const EMPTY_SUMMARY: RatingSummaryStats = { average: null, fiveStars: null }

/**
 * Controlador de mi perfil. Hoy solo hay datos del usuario actual (GET /auth/me, ya cargado por
 * AuthProvider). Las listas y los contadores dependen de PROF-01 a PROF-04 (SOLICITUDES_BACKEND.md).
 * La pestaña activa vive en la URL (`?tab=calificaciones`).
 */
export function useProfileController() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))

  function selectTab(next: ProfileTab) {
    if (next === tab) return
    const value = PROFILE_TAB_PARAM[next]
    setParams(value ? { tab: value } : {})
  }

  return { user, tab, selectTab, stats: EMPTY_STATS, summary: EMPTY_SUMMARY }
}
