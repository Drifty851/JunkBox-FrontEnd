import { request } from '../../../shared/api/httpClient'
import type { AlbumDetail, ArtistDetail, SearchResponse, SearchType, TrackDetail } from '../models/catalog.types'

/**
 * Adaptador de los endpoints /api/v1/music/* del backend (router.go · handlers_music.go).
 * Solo transporte; todos requieren Bearer.
 */
export const musicApi = {
  /**
   * GET /music/tracks/{id} → 200 TrackDetail · 400 id inválido · 401 · 404.
   * `id` puede ser el entero local o el ID de Spotify. Solo lee el catálogo local.
   */
  getTrack(id: string, accessToken: string, signal?: AbortSignal): Promise<TrackDetail> {
    return request<TrackDetail>(`/music/tracks/${encodeURIComponent(id)}`, { accessToken, signal })
  },

  /**
   * GET /music/albums/{id} (UUID o ID de Spotify) → 200 AlbumDetail · 401 · 404 (solo lee la base).
   * El backend omite `tracks` cuando el álbum no tiene canciones en la base: se normaliza a [].
   */
  async getAlbum(id: string, accessToken: string, signal?: AbortSignal): Promise<AlbumDetail> {
    const album = await request<Omit<AlbumDetail, 'tracks'> & { tracks?: AlbumDetail['tracks'] }>(
      `/music/albums/${encodeURIComponent(id)}`,
      { accessToken, signal },
    )
    return { ...album, tracks: album.tracks ?? [] }
  },

  /** GET /music/artists/{id} (UUID o ID de Spotify) → 200 ArtistDetail · 401 · 404. */
  getArtist(id: string, accessToken: string, signal?: AbortSignal): Promise<ArtistDetail> {
    return request<ArtistDetail>(`/music/artists/${encodeURIComponent(id)}`, { accessToken, signal })
  },

  /**
   * GET /music/search?q=&type=&limit= → 200 SearchResponse · 400 (q vacío, > 200, type o limit inválidos) · 401.
   * Si no hay buenos resultados locales consulta Spotify y GUARDA lo encontrado en la base
   * (cache-through, backend implementacion.md §4.1). `limit` 1..50 (20 por defecto).
   */
  search<T extends SearchType>(
    params: { q: string; type: T; limit?: number },
    accessToken: string,
    signal?: AbortSignal,
  ): Promise<SearchResponse<T>> {
    const query = new URLSearchParams({ q: params.q, type: params.type })
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    return request<SearchResponse<T>>(`/music/search?${query.toString()}`, { accessToken, signal })
  },
}
