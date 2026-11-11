/**
 * Tipos del contrato del catálogo musical del backend (compartidos por Inicio y Buscador).
 * Fuente: internal/core/domain/music.go (Track, TrackDetail, AudioFeatures, Artist, Album)
 * y README del backend §API REST (búsqueda y detalle de canción, artista y álbum).
 * Los campos `null` no están disponibles para ese elemento.
 */

/** domain.Track: canción en listados (búsqueda, pistas de un álbum). */
export interface TrackSummary {
  /** ID entero local (depende del orden de carga del catálogo). */
  id: number
  /** ID de Spotify (base62, 22 caracteres). Estable entre cargas del catálogo. */
  spotify_id: string
  track_name: string
  artist_name: string
  /** Solo viene si la canción tiene álbum en el catálogo (omitempty). */
  album_title?: string
  year: number | null
  genre: string | null
  popularity: number | null
  duration_ms: number | null
  has_embedding: boolean
  pending_embedding: boolean
}

/** domain.AudioFeatures: atributos acústicos (los de FreqBlog dejan algunos en null). */
export interface AudioFeatures {
  danceability: number | null
  energy: number | null
  key: number | null
  loudness: number | null
  mode: number | null
  speechiness: number | null
  acousticness: number | null
  instrumentalness: number | null
  liveness: number | null
  valence: number | null
  tempo: number | null
  time_signature: number | null
}

/** domain.TrackDetail: respuesta de GET /music/tracks/{id}. */
export interface TrackDetail extends TrackSummary {
  artist_id: string | null
  album_id: string | null
  isrc: string | null
  audio_features: AudioFeatures | null
  ratings: RatingSummary
}

/** Resumen de calificaciones (commit 6d77d4d). `average` es null mientras no haya votos. */
export interface RatingSummary {
  count: number
  average: number | null
}

/** domain.Artist: resultado de búsqueda `type=artist`. El detalle añade `ratings`. */
export interface Artist {
  /** UUID local. */
  id: string
  spotify_id: string | null
  name: string
  genres: string[]
  popularity: number | null
  /** Solo existe si el artista llegó desde Spotify. */
  image_url: string | null
  created_at: string
}

/** domain.Album: resultado de búsqueda `type=album`. */
export interface Album {
  /** UUID local. */
  id: string
  spotify_id: string
  title: string
  artist_id: string | null
  artist_name: string
  release_year: number | null
  /** "album" | "single" | "compilation" (valor de Spotify). */
  album_type: string
  image_url: string | null
  total_tracks: number | null
  created_at: string
}

/**
 * GET /music/albums/{id}: `tracks` solo trae las canciones que ya están en la base (el backend
 * lo omite si no hay ninguna; `musicApi.getAlbum` lo normaliza a []).
 */
export interface AlbumDetail extends Album {
  ratings: RatingSummary
  tracks: TrackSummary[]
}

/** GET /music/artists/{id}. */
export interface ArtistDetail extends Artist {
  ratings: RatingSummary
}

export type SearchType = 'track' | 'album' | 'artist'

/** Resultado de GET /music/search según `type`. */
export interface SearchResultByType {
  track: TrackSummary
  album: Album
  artist: Artist
}

/** GET /music/search → 200. `spotify_fallback` = no había buenos resultados locales y se consultó Spotify. */
export interface SearchResponse<T extends SearchType> {
  source: 'local_cache' | 'spotify_fallback'
  query: string
  type: T
  count: number
  results: SearchResultByType[T][]
}
