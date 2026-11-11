import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { musicApi } from '../infrastructure/musicApi'
import type { AlbumDetail, ArtistDetail, SearchType, TrackDetail, TrackSummary } from '../models/catalog.types'

/**
 * Catálogo en cascada para las fichas de Canción, Álbum y Artista.
 *
 * Decisión del propietario (2026-11-06): al abrir una ficha se recopila la información del
 * artista, sus álbumes y las canciones de esos álbumes, para que queden guardados en la base
 * (con sus imágenes). El backend no tiene un endpoint para ello (CAT-01, SEARCH-02), así que
 * la cascada usa GET /music/search, que consulta Spotify y GUARDA lo encontrado cuando no hay
 * buenos resultados locales. Limitación comprobada: si la base ya tiene canciones del CSV con
 * títulos parecidos, no consulta Spotify y el álbum queda incompleto (SOLICITUDES §7).
 * Cuando exista CAT-01, solo cambia `hydrateArtist`.
 */

/** Álbumes incompletos que se intentan completar por artista (1 búsqueda por álbum). */
const MAX_ALBUMS_TO_FILL = 8
/** Búsquedas simultáneas durante la cascada. */
const CONCURRENCY = 3

const normalize = (text: string) => text.trim().toLocaleLowerCase('es')

const call = <T>(request: (token: string) => Promise<T>) => authService.withAccessToken(request)

function search<T extends SearchType>(q: string, type: T, limit: number) {
  return call((token) => musicApi.search({ q: q.slice(0, 200), type, limit }, token))
}

/** Ejecuta `task` sobre cada elemento con, como mucho, `limit` tareas a la vez. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** El álbum no tiene en la base todas sus canciones. */
export function isAlbumIncomplete(album: AlbumDetail): boolean {
  return album.total_tracks !== null && album.tracks.length < album.total_tracks
}

/**
 * Intenta completar las canciones de un álbum: busca "<álbum> <artista>" (el backend trae las
 * canciones de Spotify enlazadas al álbum, si llega a consultarlo) y vuelve a pedir el álbum.
 * Nunca falla: si algo sale mal, devuelve el álbum como estaba.
 */
async function fillAlbum(album: AlbumDetail): Promise<AlbumDetail> {
  if (!isAlbumIncomplete(album)) return album
  try {
    await search(`${album.title} ${album.artist_name}`, 'track', 50)
    return await call((token) => musicApi.getAlbum(album.id, token))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error
    return album
  }
}

/** Discografía de un artista tras la cascada. */
export interface ArtistDiscography {
  artistId: string
  /** Álbumes y sencillos del artista, del más reciente al más antiguo, con sus canciones. */
  albums: AlbumDetail[]
  /** Canciones del artista en la base, de la más a la menos popular. */
  topTracks: TrackSummary[]
  /** Álbumes que siguen sin todas sus canciones (CAT-01). */
  incompleteAlbums: number
}

const discographies = new Map<string, Promise<ArtistDiscography>>()

async function buildDiscography(artist: { id: string; name: string }): Promise<ArtistDiscography> {
  const sameArtist = (id: string | null, name: string) => id === artist.id || normalize(name) === normalize(artist.name)

  // 1. Artista (si no tiene foto, la búsqueda de artistas puede traerla de Spotify) y sus álbumes.
  const [, albumSearch, trackSearch] = await Promise.all([
    search(artist.name, 'artist', 5).catch(() => null),
    search(artist.name, 'album', 50),
    search(artist.name, 'track', 50).catch(() => null),
  ])
  const albumIds = albumSearch.results
    .filter((album) => sameArtist(album.artist_id, album.artist_name))
    .map((album) => album.id)

  // 2. Detalle de cada álbum (con las canciones que ya están en la base).
  const details = await mapWithConcurrency(albumIds, CONCURRENCY, (id) =>
    call((token) => musicApi.getAlbum(id, token)).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) throw error
      return null
    }),
  )
  let albums = details.filter((album): album is AlbumDetail => album !== null)

  // 3. Completar los álbumes incompletos (los más grandes primero, hasta MAX_ALBUMS_TO_FILL).
  const toFill = albums
    .filter(isAlbumIncomplete)
    .sort((a, b) => (b.total_tracks ?? 0) - (a.total_tracks ?? 0))
    .slice(0, MAX_ALBUMS_TO_FILL)
  const filled = new Map((await mapWithConcurrency(toFill, CONCURRENCY, fillAlbum)).map((album) => [album.id, album]))
  albums = albums
    .map((album) => filled.get(album.id) ?? album)
    .sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0))

  // 4. Canciones del artista: las de la búsqueda y las de sus álbumes, sin repetir.
  const bySpotifyId = new Map<string, TrackSummary>()
  for (const track of [...(trackSearch?.results ?? []), ...albums.flatMap((album) => album.tracks)]) {
    if (sameArtist(null, track.artist_name) && !bySpotifyId.has(track.spotify_id)) {
      bySpotifyId.set(track.spotify_id, track)
    }
  }
  const topTracks = [...bySpotifyId.values()].sort((a, b) => (b.popularity ?? -1) - (a.popularity ?? -1))

  return { artistId: artist.id, albums, topTracks, incompleteAlbums: albums.filter(isAlbumIncomplete).length }
}

/**
 * Casos de uso del catálogo para las fichas. Todas las llamadas usan
 * `authService.withAccessToken()` (renovación del token compartida).
 */
export const catalogService = {
  getTrack(id: string, signal?: AbortSignal): Promise<TrackDetail> {
    return call((token) => musicApi.getTrack(id, token, signal))
  },

  getAlbum(id: string, signal?: AbortSignal): Promise<AlbumDetail> {
    return call((token) => musicApi.getAlbum(id, token, signal))
  },

  getArtist(id: string, signal?: AbortSignal): Promise<ArtistDetail> {
    return call((token) => musicApi.getArtist(id, token, signal))
  },

  /** Completa (si se puede) las canciones de un álbum. Para la ficha de álbum. */
  fillAlbum,

  /**
   * Cascada de un artista: sus álbumes (con carátula) y las canciones de esos álbumes, que el
   * backend guarda en la base. Se hace una sola vez por artista y sesión: las fichas que la
   * piden después reciben la misma promesa. Si falla, se olvida para poder reintentar.
   * No admite AbortSignal a propósito: la ficha que la lanzó puede desmontarse sin cancelarla.
   */
  hydrateArtist(artist: { id: string; name: string }): Promise<ArtistDiscography> {
    const cached = discographies.get(artist.id)
    if (cached) return cached
    const promise = buildDiscography(artist)
    discographies.set(artist.id, promise)
    promise.catch(() => discographies.delete(artist.id))
    return promise
  },

  /**
   * Álbum al que pertenece una canción sin `album_id` (las del CSV):
   *  1. si la discografía ya está, el álbum que contiene la canción (mismo ID de Spotify);
   *  2. si no, un álbum del mismo artista con el título de la canción (su sencillo).
   */
  findAlbumForTrack(track: TrackSummary, discography: ArtistDiscography | null): AlbumDetail | null {
    const albums = discography?.albums ?? []
    const containing = albums.find((album) => album.tracks.some((item) => item.spotify_id === track.spotify_id))
    if (containing) return containing
    return albums.find((album) => normalize(album.title) === normalize(track.track_name)) ?? null
  },
}
