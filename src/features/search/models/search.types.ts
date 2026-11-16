/** Ruta del Buscador. La consulta va en `?q=` para poder compartirla y volver atrás. */
export const SEARCH_PATH = '/buscar'

/**
 * Pestañas del Buscador (SegmentedControl de Figma). La activa va en `?tipo=usuarios`, junto a `?q=`,
 * para poder compartirla y volver atrás; sin `tipo` es Música.
 */
export type SearchKind = 'music' | 'users'
export const SEARCH_KIND_PARAM = 'tipo'
export const USERS_KIND_VALUE = 'usuarios'
export const kindFromParam = (value: string | null): SearchKind => (value === USERS_KIND_VALUE ? 'users' : 'music')

/**
 * Persona en "Buscador · Usuarios" (contrato propuesto en SEARCH-04). Sin bio (decisión del
 * propietario, 2026-11-15, como en Perfil y Configuración).
 */
export interface UserResult {
  username: string
  displayName: string | null
  avatarUrl: string | null
  followersCount: number
  /** Si ya la sigo ("Siguiendo"). */
  following: boolean
}

/** Canción en la lista de resultados (Figma · MusicRow). */
export interface SongResult {
  /** ID de Spotify: clave de la fila y, en el paso del reproductor, la canción a reproducir. */
  spotifyId: string
  title: string
  artist: string
  /** Álbum, si la canción tiene uno en el catálogo. */
  album: string | null
  /** Carátula del álbum (`album_image_url`); null si el backend aún no la conoce. */
  imageUrl: string | null
}

export interface AlbumResult {
  /** UUID local (para pedir su detalle y calificación). */
  id: string
  spotifyId: string
  title: string
  artist: string
  year: number | null
  /** "Álbum", "Sencillo" o "Recopilatorio". */
  kind: string
  imageUrl: string | null
}

export interface ArtistResult {
  id: string
  name: string
  /** Primer género conocido, si lo hay. */
  genre: string | null
  imageUrl: string | null
}

export interface SearchResults {
  query: string
  songs: SongResult[]
  albums: AlbumResult[]
  artists: ArtistResult[]
}

/** Sugerencia del buscador de la Navbar: cualquier tipo, en una sola lista. */
export interface Suggestion {
  /** Clave única ("track:<id>", "album:<id>", "artist:<id>"). */
  key: string
  kind: 'Canción' | 'Álbum' | 'Artista'
  title: string
  subtitle: string
  imageUrl: string | null
  shape: 'square' | 'circle'
  /** Ficha del elemento (/cancion, /album o /artista). */
  to: string
  /** Objetivo para calificar/reseñar (Escribir Reseña): tipo e id que acepta el backend. */
  target: { type: 'song' | 'album' | 'artist'; id: string }
}

/** Calificación de un álbum (de su detalle; la búsqueda no la trae, SEARCH-03). */
export interface AlbumRating {
  average: number | null
  count: number
}
