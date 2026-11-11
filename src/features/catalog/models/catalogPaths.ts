/**
 * Rutas de las fichas del catálogo. El `id` es el que acepta el backend en el detalle:
 *  - canción: ID de Spotify (o el entero local);
 *  - álbum y artista: UUID local (o ID de Spotify).
 */
export const SONG_PATH = '/cancion/:id'
export const ALBUM_PATH = '/album/:id'
export const ARTIST_PATH = '/artista/:id'

export const songPath = (id: string | number) => `/cancion/${encodeURIComponent(String(id))}`
export const albumPath = (id: string) => `/album/${encodeURIComponent(id)}`
export const artistPath = (id: string) => `/artista/${encodeURIComponent(id)}`

/** Tipo de objetivo de calificaciones y reseñas (contrato del backend). */
export type CatalogTargetType = 'song' | 'album' | 'artist'

/** Enlace público de Spotify para "Reproducir en Spotify" (abre su web o app). */
export function spotifyUrl(type: CatalogTargetType, spotifyId: string): string {
  const kind = type === 'song' ? 'track' : type
  return `https://open.spotify.com/${kind}/${encodeURIComponent(spotifyId)}`
}
