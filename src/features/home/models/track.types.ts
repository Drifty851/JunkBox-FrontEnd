/**
 * Tipos del contrato de canciones del backend.
 * Fuente: internal/core/domain/music.go (Track, TrackDetail, AudioFeatures)
 * y README del backend §API REST (endpoint 8, GET /music/tracks/{id}).
 * Los campos `null` no están disponibles para esa canción.
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
}
