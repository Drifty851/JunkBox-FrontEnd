import { request } from '../../../shared/api/httpClient'
import type { TrackDetail } from '../models/track.types'

/**
 * Adaptador de los endpoints /api/v1/music/* del backend (router.go · handlers_music.go).
 * Solo transporte. No se usa /music/search en Inicio: en cache-miss consulta Spotify
 * y escribe en la base de datos.
 */
export const musicApi = {
  /**
   * GET /music/tracks/{id} (Bearer) → 200 TrackDetail · 400 id inválido · 401 · 404 no encontrado.
   * `id` puede ser el entero local o el ID de Spotify. Solo lee el catálogo local.
   */
  getTrack(id: string, accessToken: string, signal?: AbortSignal): Promise<TrackDetail> {
    return request<TrackDetail>(`/music/tracks/${encodeURIComponent(id)}`, { accessToken, signal })
  },
}
