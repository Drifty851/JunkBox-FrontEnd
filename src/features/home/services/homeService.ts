import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { musicApi } from '../../music/infrastructure/musicApi'
import type { TrackDetail } from '../../music/models/catalog.types'
import { RECOMMENDED_TRACKS, type TemplateTrack } from '../data/homeTemplate'
import type { RecommendedTrack } from '../models/home.types'

function toRecommendedTrack(track: TrackDetail, imageUrl: string | null): RecommendedTrack {
  return {
    spotifyId: track.spotify_id,
    title: track.track_name,
    artist: track.artist_name,
    imageUrl,
  }
}

/**
 * Carátula del álbum de una canción de la plantilla. Nunca falla: si no se encuentra, `null`
 * (la vista muestra el recuadro neutro).
 *  1. GET /music/albums/{spotifyId}: el álbum ya está en la base.
 *  2. Si responde 404, GET /music/search?type=album: el backend lo trae de Spotify y lo guarda,
 *     así que la próxima vez basta el paso 1. Se elige el resultado con el mismo ID de Spotify.
 */
async function getAlbumCover(album: TemplateTrack['album'], signal?: AbortSignal): Promise<string | null> {
  try {
    const detail = await authService.withAccessToken((token) => musicApi.getAlbum(album.spotifyId, token, signal))
    return detail.image_url
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) return null
  }
  try {
    const response = await authService.withAccessToken((token) =>
      musicApi.search({ q: album.search, type: 'album', limit: 10 }, token, signal),
    )
    return response.results.find((result) => result.spotify_id === album.spotifyId)?.image_url ?? null
  } catch {
    return null
  }
}

/** Casos de uso de Inicio. */
export const homeService = {
  /**
   * "Hecho para tus oídos": hoy sale de la plantilla (RECOMMENDED_TRACKS). Por cada canción se
   * piden en paralelo sus datos y la carátula de su álbum. Cuando exista el endpoint de
   * recomendaciones (HOME-01), solo cambia esta función.
   *
   * - Las canciones que no existen en el catálogo (404) se omiten sin romper la sección.
   * - Un 401 (sesión caducada sin renovación posible) se propaga para cerrar la sesión.
   * - Si no se pudo cargar ninguna por otro motivo (red, 500…), se propaga el primer error.
   * - Una carátula que falla no afecta a la canción: queda sin imagen.
   */
  async getRecommendations(signal?: AbortSignal): Promise<RecommendedTrack[]> {
    const results = await Promise.allSettled(
      RECOMMENDED_TRACKS.map(async ({ trackId, album }) => {
        const [track, imageUrl] = await Promise.all([
          authService.withAccessToken((token) => musicApi.getTrack(trackId, token, signal)),
          getAlbumCover(album, signal),
        ])
        return toRecommendedTrack(track, imageUrl)
      }),
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
