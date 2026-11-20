/**
 * Configuración y tipos de la vinculación con Spotify (Authorization Code con PKCE, sin secreto).
 * Documentación: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

/** Client ID público de la app de Spotify (.env.local). Sin él, la vinculación queda deshabilitada. */
export const SPOTIFY_CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''

/** Ruta de retorno del flujo OAuth dentro de Junkbox. */
export const SPOTIFY_CALLBACK_PATH = '/spotify/callback'

/** URL de retorno fija (opcional): si está, la vinculación solo funciona desde su origen. */
const FIXED_REDIRECT_URI: string = import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? ''

/** Origen por defecto en escritorio. Spotify no acepta "localhost" (desde 2025), sí la IP de loopback. */
const LOOPBACK_ORIGIN = 'http://127.0.0.1:5173'

/**
 * Spotify solo acepta URLs de retorno con https o con la IP de loopback. Desde el teléfono, Junkbox
 * se abre con https (certificado de desarrollo, README · "Probar en el teléfono").
 */
export function isSecureLinkOrigin(origin: string): boolean {
  const url = new URL(origin)
  return url.protocol === 'https:' || url.hostname === '127.0.0.1'
}

/**
 * URL de retorno de la vinculación (2026-11-19): la del origen actual si Spotify la acepta
 * (`http://127.0.0.1:5173` en escritorio, `https://<IP de la PC>:5173` en el teléfono); si no, la de
 * loopback. Cada una debe estar registrada en el panel de Spotify. VITE_SPOTIFY_REDIRECT_URI fija una.
 */
export function spotifyRedirectUri(): string {
  if (FIXED_REDIRECT_URI) return FIXED_REDIRECT_URI
  const origin = window.location.origin
  return `${isSecureLinkOrigin(origin) ? origin : LOOPBACK_ORIGIN}${SPOTIFY_CALLBACK_PATH}`
}

/** Origen desde el que debe iniciarse la vinculación (el mismo de la URL de retorno). */
export const spotifyLinkOrigin = (): string => new URL(spotifyRedirectUri()).origin

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

/** Dispositivo de Spotify Connect (GET /v1/me/player/devices y `device` de /me/player). */
export interface SpotifyDevice {
  id: string | null
  name: string
  /** "Computer", "Smartphone", "Tablet", "Speaker"… */
  type: string
  is_active: boolean
  volume_percent: number | null
  supports_volume: boolean
}

/** GET /v1/tracks/{id} (campos que se usan). */
export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

/** GET /v1/me/player (campos que se usan): qué suena, dónde y en qué punto. */
export interface SpotifyCurrentPlayback {
  is_playing: boolean
  device: SpotifyDevice
  progress_ms: number | null
  /** null si suena un anuncio o algo que no es una canción. */
  item: SpotifyTrack | null
}

/** Estado de la vinculación que ve la interfaz. */
export type SpotifyLinkStatus =
  | { status: 'checking' }
  | { status: 'unlinked' }
  | { status: 'linked'; profile: SpotifyProfile }
  | { status: 'error'; message: string }
