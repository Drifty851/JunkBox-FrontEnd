import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { musicApi } from '../../music/infrastructure/musicApi'
import type { Album, Artist, TrackSummary } from '../../music/models/catalog.types'
import type {
  AlbumRating,
  AlbumResult,
  ArtistResult,
  SearchResults,
  SongResult,
  Suggestion,
} from '../models/search.types'
import { albumPath, artistPath, songPath } from '../../catalog/models/catalogPaths'

type Limits = Record<'track' | 'album' | 'artist', number>

/** Cuántos resultados se piden de cada tipo en el Buscador (el backend admite 1..50). */
const PAGE_LIMITS: Limits = { track: 20, album: 10, artist: 5 }
/** En las sugerencias de la Navbar basta con pocos de cada tipo. */
const SUGGESTION_LIMITS: Limits = { track: 4, album: 4, artist: 4 }
const SUGGESTION_COUNT = 4

const ALBUM_KINDS: Record<string, string> = { album: 'Álbum', single: 'Sencillo', compilation: 'Recopilatorio' }

const normalize = (text: string) => text.trim().toLocaleLowerCase('es')

function toAlbumResult(album: Album): AlbumResult {
  return {
    id: album.id,
    spotifyId: album.spotify_id,
    title: album.title,
    artist: album.artist_name,
    year: album.release_year,
    kind: ALBUM_KINDS[album.album_type] ?? 'Álbum',
    imageUrl: album.image_url,
  }
}

function toArtistResult(artist: Artist): ArtistResult {
  return { id: artist.id, name: artist.name, genre: artist.genres[0] ?? null, imageUrl: artist.image_url }
}

function toSongResult(track: TrackSummary): SongResult {
  return {
    spotifyId: track.spotify_id,
    title: track.track_name,
    artist: track.artist_name,
    album: track.album_title ?? null,
    imageUrl: track.album_image_url,
  }
}

/**
 * Relevancia aproximada frente a la consulta (la API no da un puntaje común entre tipos):
 * 3 = igual, 2 = empieza igual, 1 = la contiene, 0 = otra coincidencia del backend.
 */
function relevance(name: string, query: string): number {
  const text = normalize(name)
  const q = normalize(query)
  if (text === q) return 3
  if (text.startsWith(q)) return 2
  return text.includes(q) ? 1 : 0
}

/**
 * Relevancia de una sugerencia: la de su nombre o, si la consulta es exactamente el artista,
 * 2,5 (así "Hoke" muestra al artista y luego sus canciones y álbumes, antes que "Hokey Pokey").
 */
function suggestionScore(title: string, artist: string | null, query: string): number {
  const byArtist = artist !== null && normalize(artist) === normalize(query) ? 2.5 : 0
  return Math.max(relevance(title, query), byArtist)
}

function toSuggestions(results: SearchResults): Suggestion[] {
  const artistOf = new Map<string, string>()
  // La misma canción puede venir varias veces (sencillo y álbum): se deja la primera.
  const seen = new Set<string>()
  const uniqueSongs = results.songs.filter((song) => {
    const id = `${normalize(song.title)}|${normalize(song.artist)}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  const songs = uniqueSongs.map<Suggestion>((song) => ({
    key: `track:${song.spotifyId}`,
    kind: 'Canción',
    title: song.title,
    subtitle: `Canción · ${song.artist}`,
    imageUrl: song.imageUrl,
    shape: 'square',
    to: songPath(song.spotifyId),
    target: { type: 'song', id: song.spotifyId },
  }))
  results.songs.forEach((song) => artistOf.set(`track:${song.spotifyId}`, song.artist))
  const albums = results.albums.map<Suggestion>((album) => ({
    key: `album:${album.id}`,
    kind: 'Álbum',
    title: album.title,
    subtitle: `${album.kind} · ${album.artist}`,
    imageUrl: album.imageUrl,
    shape: 'square',
    to: albumPath(album.id),
    target: { type: 'album', id: album.id },
  }))
  results.albums.forEach((album) => artistOf.set(`album:${album.id}`, album.artist))
  const artists = results.artists.map<Suggestion>((artist) => ({
    key: `artist:${artist.id}`,
    kind: 'Artista',
    title: artist.name,
    subtitle: 'Artista',
    imageUrl: artist.imageUrl,
    shape: 'circle',
    to: artistPath(artist.id),
    target: { type: 'artist', id: artist.id },
  }))

  // Se intercalan los tipos (cada lista ya viene ordenada por el backend) y después se ordena,
  // de forma estable, por relevancia: así ganan las coincidencias exactas de cualquier tipo.
  const interleaved: Suggestion[] = []
  for (let index = 0; index < Math.max(songs.length, albums.length, artists.length); index++) {
    for (const list of [artists, songs, albums]) if (list[index]) interleaved.push(list[index])
  }
  const scored = interleaved.map((item) => ({
    item,
    score: suggestionScore(item.title, artistOf.get(item.key) ?? null, results.query),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, SUGGESTION_COUNT).map(({ item }) => item)
}

/** Casos de uso del Buscador. */
export const searchService = {
  /**
   * Busca canciones, álbumes y artistas en paralelo (tres llamadas a GET /music/search).
   * Si un tipo falla, los demás se muestran igual. Un 401 se propaga para cerrar la sesión,
   * y si fallan los tres se propaga el primer error.
   */
  async search(query: string, signal?: AbortSignal, limits: Limits = PAGE_LIMITS): Promise<SearchResults> {
    const call = <T extends 'track' | 'album' | 'artist'>(type: T) =>
      authService.withAccessToken((token) => musicApi.search({ q: query, type, limit: limits[type] }, token, signal))

    const [tracks, albums, artists] = await Promise.allSettled([call('track'), call('album'), call('artist')])
    const failures = [tracks, albums, artists].flatMap((result) => (result.status === 'rejected' ? [result.reason] : []))

    const unauthorized = failures.find((error) => error instanceof ApiError && error.status === 401)
    if (unauthorized) throw unauthorized
    if (failures.length === 3) throw failures[0]

    const albumList = albums.status === 'fulfilled' ? albums.value.results : []
    return {
      query,
      songs: tracks.status === 'fulfilled' ? tracks.value.results.map(toSongResult) : [],
      albums: albumList.map(toAlbumResult),
      artists: artists.status === 'fulfilled' ? artists.value.results.map(toArtistResult) : [],
    }
  },

  /** Las 4 mejores coincidencias de cualquier tipo, para el buscador de la Navbar. */
  async suggest(query: string, signal?: AbortSignal): Promise<Suggestion[]> {
    return toSuggestions(await searchService.search(query, signal, SUGGESTION_LIMITS))
  },

  /** Calificación de un álbum (GET /music/albums/{id}). */
  async getAlbumRating(albumId: string, signal?: AbortSignal): Promise<AlbumRating> {
    const album = await authService.withAccessToken((token) => musicApi.getAlbum(albumId, token, signal))
    return { average: album.ratings.average, count: album.ratings.count }
  },
}
