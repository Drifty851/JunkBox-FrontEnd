import { authService } from '../../auth/services/authService'
import { homeApi } from '../infrastructure/homeApi'
import type { HomeItem } from '../models/home.types'

/** Sección de recomendaciones de GET /home. */
const MADE_FOR_YOU = 'made_for_you'

/** Casos de uso de Inicio (HOME-01). El feed y las sugerencias están en `social/`. */
export const homeService = {
  /**
   * "Hecho para tus oídos": canciones parecidas a lo último que el usuario calificó o reseñó, o
   * las más populares si aún no tiene actividad. Usado por Inicio y por "Ver todo".
   */
  async getRecommendations(limit: number, signal?: AbortSignal): Promise<HomeItem[]> {
    const home = await authService.withAccessToken((token) => homeApi.getHome(limit, token, signal))
    const section = home.sections.find((item) => item.id === MADE_FOR_YOU) ?? home.sections[0]
    return section?.items ?? []
  },
}
