import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { RECOMMENDED_TRACK_IDS } from '../data/homeTemplate'
import type { RecommendedTrack } from '../models/home.types'
import type { TrackDetail } from '../models/track.types'
import { musicApi } from '../infrastructure/musicApi'

function toRecommendedTrack(track: TrackDetail): RecommendedTrack {
  return {
    spotifyId: track.spotify_id,
    title: track.track_name,
    artist: track.artist_name,
    // El backend no expone carátula por canción todavía.
    imageUrl: null,
  }
}

/** Casos de uso de Inicio. */
export const homeService = {
  /**
   * "Hecho para tus oídos": hoy sale de la plantilla (RECOMMENDED_TRACK_IDS) con una petición
   * por canción, en paralelo. Cuando exista el endpoint de recomendaciones, solo cambia esta función.
   *
   * - Las canciones que no existen en el catálogo (404) se omiten sin romper la sección.
   * - Un 401 (sesión caducada sin renovación posible) se propaga para cerrar la sesión.
   * - Si no se pudo cargar ninguna por otro motivo (red, 500…), se propaga el primer error.
   */
  async getRecommendations(signal?: AbortSignal): Promise<RecommendedTrack[]> {
    const results = await Promise.allSettled(
      RECOMMENDED_TRACK_IDS.map((id) =>
        authService.withAccessToken((accessToken) => musicApi.getTrack(id, accessToken, signal)),
      ),
    )

    const tracks: RecommendedTrack[] = []
    const failures: unknown[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        tracks.push(toRecommendedTrack(result.value))
      } else if (!(result.reason instanceof ApiError && result.reason.status === 404)) {
        failures.push(result.reason)
      }
    }

    const unauthorized = failures.find((error) => error instanceof ApiError && error.status === 401)
    if (unauthorized) throw unauthorized
    if (tracks.length === 0 && failures.length > 0) throw failures[0]
    return tracks
  },
}
