/**
 * Configuración y tipos de la vinculación con Spotify (Authorization Code con PKCE, sin secreto).
 * Documentación: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

/** Client ID público de la app de Spotify (.env.local). Sin él, la vinculación queda deshabilitada. */
export const SPOTIFY_CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''

/** Ruta de retorno del flujo OAuth dentro de Junkbox. */
export const SPOTIFY_CALLBACK_PATH = '/spotify/callback'

/**
 * URL de retorno registrada en el panel de Spotify. Spotify no acepta "localhost" (desde 2025):
 * se usa la IP de loopback. Se puede cambiar con VITE_SPOTIFY_REDIRECT_URI.
 */
export const SPOTIFY_REDIRECT_URI: string =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? `http://127.0.0.1:5173${SPOTIFY_CALLBACK_PATH}`

/** Origen desde el que debe iniciarse la vinculación (el mismo de la URL de retorno). */
export const SPOTIFY_LINK_ORIGIN = new URL(SPOTIFY_REDIRECT_URI).origin

/**
 * Permisos mínimos: reproducir en el navegador (streaming + Web Playback SDK, solo Premium),
 * controlar la reproducción y leer el perfil para saber si la cuenta es Premium.
 */
export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
] as const

/** Respuesta de POST https://accounts.spotify.com/api/token. */
export interface SpotifyTokenResponse {
  access_token: string
  token_type: 'Bearer'
  scope: string
  /** Segundos de vida del access token (3600). */
  expires_in: number
  /** Con PKCE, Spotify puede devolver uno nuevo en cada renovación: hay que guardarlo. */
  refresh_token?: string
}

/** GET https://api.spotify.com/v1/me (campos que se usan). */
export interface SpotifyProfile {
  id: string
  display_name: string | null
  /** "premium" es necesario para el Web Playback SDK. */
  product?: 'premium' | 'free' | 'open' | string
}

/** Estado de la vinculación que ve la interfaz. */
export type SpotifyLinkStatus =
  | { status: 'checking' }
  | { status: 'unlinked' }
  | { status: 'linked'; profile: SpotifyProfile }
  | { status: 'error'; message: string }
