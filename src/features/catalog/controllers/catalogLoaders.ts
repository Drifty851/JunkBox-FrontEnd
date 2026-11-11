import { ApiError } from '../../../shared/api/httpClient'
import type { AlbumDetail, ArtistDetail, TrackDetail } from '../../music/models/catalog.types'
import { catalogService, type ArtistDiscography } from '../../music/services/catalogService'
import type { Rating, ReviewPage, ReviewTargetType } from '../../reviews/models/review.types'
import { reviewsService } from '../../reviews/services/reviewsService'

/**
 * Cargadores (funciones de módulo, estables) que usan las fichas con `useLoad`.
 * Las piezas secundarias (artista, álbum) no rompen la ficha si fallan: quedan en null.
 */

/** Reseñas visibles en cada ficha (Figma muestra 1; se piden algunas más para el contador). */
export const REVIEWS_SHOWN = 3

async function optional<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error
    return null
  }
}

export interface SongData {
  track: TrackDetail
  artist: ArtistDetail | null
  album: AlbumDetail | null
}

export async function loadSong(id: string, signal: AbortSignal): Promise<SongData> {
  const track = await catalogService.getTrack(id, signal)
  const [artist, album] = await Promise.all([
    track.artist_id ? optional(catalogService.getArtist(track.artist_id, signal)) : null,
    track.album_id ? optional(catalogService.getAlbum(track.album_id, signal)) : null,
  ])
  return { track, artist, album }
}

export interface AlbumData {
  album: AlbumDetail
  artist: ArtistDetail | null
}

export async function loadAlbum(id: string, signal: AbortSignal): Promise<AlbumData> {
  const album = await catalogService.getAlbum(id, signal)
  const artist = album.artist_id ? await optional(catalogService.getArtist(album.artist_id, signal)) : null
  return { album, artist }
}

/** El álbum con sus canciones completadas por la cascada (CAT-01). `key` = id del álbum. */
export async function loadFilledAlbum(id: string, signal: AbortSignal): Promise<AlbumDetail> {
  return catalogService.fillAlbum(await catalogService.getAlbum(id, signal))
}

export function loadArtist(id: string, signal: AbortSignal): Promise<ArtistDetail> {
  return catalogService.getArtist(id, signal)
}

/** Clave de la cascada de un artista: necesita id y nombre. */
export const discographyKey = (artist: { id: string; name: string }) => JSON.stringify([artist.id, artist.name])

/** Cascada del artista (una vez por sesión; no se cancela al salir de la ficha). */
export function loadDiscography(key: string): Promise<ArtistDiscography> {
  const [id, name] = JSON.parse(key) as [string, string]
  return catalogService.hydrateArtist({ id, name })
}

/** Clave de reseñas: "<tipo>:<id>". */
export const reviewsKey = (type: ReviewTargetType, id: string) => `${type}:${id}`

export function loadReviews(key: string, signal: AbortSignal): Promise<ReviewPage> {
  const separator = key.indexOf(':')
  return reviewsService.listForTarget(
    key.slice(0, separator) as ReviewTargetType,
    key.slice(separator + 1),
    REVIEWS_SHOWN,
    signal,
  )
}

/** Mi calificación del objetivo (null si no he votado). `key` = "<tipo>:<id>". */
export function loadMyRating(key: string, signal: AbortSignal): Promise<Rating | null> {
  const separator = key.indexOf(':')
  return reviewsService.getMyRating(key.slice(0, separator) as ReviewTargetType, key.slice(separator + 1), signal)
}
