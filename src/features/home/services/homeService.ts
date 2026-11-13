import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { musicApi } from '../../music/infrastructure/musicApi'
import type { TrackDetail } from '../../music/models/catalog.types'
import { RECOMMENDED_TRACKS } from '../data/homeTemplate'
import type { RecommendedTrack } from '../models/home.types'

function toRecommendedTrack(track: TrackDetail): RecommendedTrack {
  return {
    spotifyId: track.spotify_id,
    title: track.track_name,
    artist: track.artist_name,
    imageUrl: track.album_image_url,
  }
}

/** Casos de uso de Inicio. */
export const homeService = {
  /**
   * "Hecho para tus oídos": hoy sale de la plantilla (RECOMMENDED_TRACKS). Se piden en paralelo
   * los datos de cada canción, que ya traen su carátula (`album_image_url`). Cuando exista el
   * endpoint de recomendaciones (HOME-01), solo cambia esta función.
   *
   * - Las canciones que no existen en el catálogo (404) se omiten sin romper la sección.
   * - Un 401 (sesión caducada sin renovación posible) se propaga para cerrar la sesión.
   * - Si no se pudo cargar ninguna por otro motivo (red, 500…), se propaga el primer error.
   * - Sin `album_image_url` la tarjeta queda con el recuadro neutro.
   */
  async getRecommendations(signal?: AbortSignal): Promise<RecommendedTrack[]> {
    const results = await Promise.allSettled(
      RECOMMENDED_TRACKS.map(async ({ trackId }) =>
        toRecommendedTrack(await authService.withAccessToken((token) => musicApi.getTrack(trackId, token, signal))),
      ),
    )

    const tracks: RecommendedTrack[] = []
    const failures: unknown[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        tracks.push(result.value)
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
