import type { SpotifyCurrentPlayback, SpotifyProfile, SpotifyTokenResponse, SpotifyTrack } from '../models/spotify'

const ACCOUNTS = 'https://accounts.spotify.com'
const API = 'https://api.spotify.com/v1'

/** Error de una llamada a Spotify, con el estado HTTP. */
export class SpotifyError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'SpotifyError'
    this.status = status
  }
}

async function tokenRequest(body: Record<string, string>): Promise<SpotifyTokenResponse> {
  const response = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error_description?: string } | null
    throw new SpotifyError(response.status, detail?.error_description ?? 'Spotify rechazó la autorización.')
  }
  return (await response.json()) as SpotifyTokenResponse
}

/** Adaptador de las APIs de Spotify (cuentas y Web API). */
export const spotifyApi = {
  authorizeUrl: `${ACCOUNTS}/authorize`,

  /** Cambia el código del retorno por los tokens (PKCE: code_verifier en lugar de secreto). */
  exchangeCode(clientId: string, code: string, redirectUri: string, codeVerifier: string) {
    return tokenRequest({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    })
  },

  /** Renueva el access token con el refresh token. */
  refresh(clientId: string, refreshToken: string) {
    return tokenRequest({ grant_type: 'refresh_token', client_id: clientId, refresh_token: refreshToken })
  },

  /**
   * PUT /v1/me/player/play?device_id=: reproduce una canción en el dispositivo del SDK (Junkbox).
   * 204 si se acepta; 403 si la cuenta no es Premium; 404 si el dispositivo aún no está listo.
   */
  async play(accessToken: string, deviceId: string, spotifyTrackId: string): Promise<void> {
    const response = await fetch(`${API}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [`spotify:track:${spotifyTrackId}`] }),
    })
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new SpotifyError(response.status, detail?.error?.message ?? 'Spotify no pudo reproducir la canción.')
    }
  },

  /**
   * PUT /v1/me/player { device_ids, play: false }: pasa la sesión de Spotify al dispositivo de
   * Junkbox. Ayuda a que Spotify registre el dispositivo recién creado antes de pedir la canción.
   */
  async transfer(accessToken: string, deviceId: string): Promise<void> {
    const response = await fetch(`${API}/me/player`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    })
    if (!response.ok && response.status !== 404) {
      throw new SpotifyError(response.status, 'Spotify no reconoció el reproductor de Junkbox.')
    }
  },

  /**
   * GET /v1/me/player: qué suena ahora en la cuenta y en qué dispositivo (scope
   * user-read-playback-state). `null` si no hay nada activo (204).
   */
  async currentPlayback(accessToken: string): Promise<SpotifyCurrentPlayback | null> {
    const response = await fetch(`${API}/me/player`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (response.status === 204) return null
    if (!response.ok) throw new SpotifyError(response.status, 'No se pudo consultar la reproducción de Spotify.')
    return (await response.json()) as SpotifyCurrentPlayback
  },

  /** GET /v1/tracks/{id}: datos de una canción (para mostrarla en pausa sin haberla reproducido aquí). */
  async track(accessToken: string, spotifyTrackId: string): Promise<SpotifyTrack> {
    const response = await fetch(`${API}/tracks/${encodeURIComponent(spotifyTrackId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new SpotifyError(response.status, 'No se pudo leer la canción en Spotify.')
    return (await response.json()) as SpotifyTrack
  },

  /** GET /v1/me: perfil del usuario de Spotify (incluye `product`). */
  async me(accessToken: string): Promise<SpotifyProfile> {
    const response = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) throw new SpotifyError(response.status, 'No se pudo leer tu cuenta de Spotify.')
    return (await response.json()) as SpotifyProfile
  },
}
