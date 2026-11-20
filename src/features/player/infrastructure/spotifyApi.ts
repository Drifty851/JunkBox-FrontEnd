import type { SpotifyCurrentPlayback, SpotifyDevice, SpotifyProfile, SpotifyTokenResponse, SpotifyTrack } from '../models/spotify'

const ACCOUNTS = 'https://accounts.spotify.com'
const API = 'https://api.spotify.com/v1'

/** Motivo de Spotify cuando la cuenta no es Premium (403 de las órdenes de reproducción). */
export const PREMIUM_REQUIRED = 'PREMIUM_REQUIRED'

/**
 * Error de una llamada a Spotify, con el estado HTTP y, en las órdenes de reproducción, el motivo
 * (`error.reason`). Un 403 no siempre es "falta Premium": también es "Restriction violated" cuando la
 * orden no aplica (reanudar algo que ya suena, pausar algo en pausa).
 */
export class SpotifyError extends Error {
  readonly status: number
  readonly reason: string | null
  constructor(status: number, message: string, reason: string | null = null) {
    super(message)
    this.name = 'SpotifyError'
    this.status = status
    this.reason = reason
  }

  /** La cuenta no es Premium. */
  get premiumRequired(): boolean {
    return this.status === 403 && (this.reason === PREMIUM_REQUIRED || /premium/i.test(this.message))
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

/**
 * Orden de reproducción (PUT/POST a /v1/me/player/…): 200, 202 o 204 si se acepta. 403 si la
 * cuenta no es Premium o el dispositivo no lo permite; 404 si el dispositivo no está disponible.
 */
async function command(accessToken: string, method: 'PUT' | 'POST', path: string, body?: unknown): Promise<void> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { message?: string; reason?: string } } | null
    throw new SpotifyError(response.status, detail?.error?.message ?? 'Spotify no pudo completar la acción.', detail?.error?.reason ?? null)
  }
}

const withDevice = (path: string, deviceId: string, extra: Record<string, string> = {}) =>
  `${path}?${new URLSearchParams({ device_id: deviceId, ...extra }).toString()}`

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
   * PUT /v1/me/player/play?device_id=: reproduce una canción en un dispositivo (el del SDK o, con
   * Connect, la app de Spotify del teléfono), desde `positionMs`.
   * 204 si se acepta; 403 si la cuenta no es Premium; 404 si el dispositivo aún no está listo.
   */
  play(accessToken: string, deviceId: string, spotifyTrackId: string, positionMs = 0): Promise<void> {
    return command(accessToken, 'PUT', withDevice('/me/player/play', deviceId), {
      uris: [`spotify:track:${spotifyTrackId}`],
      position_ms: Math.max(0, Math.round(positionMs)),
    })
  },

  /** PUT /v1/me/player/play sin cuerpo: continúa lo que estaba en pausa. */
  resume(accessToken: string, deviceId: string): Promise<void> {
    return command(accessToken, 'PUT', withDevice('/me/player/play', deviceId))
  },

  /** PUT /v1/me/player/pause. */
  pause(accessToken: string, deviceId: string): Promise<void> {
    return command(accessToken, 'PUT', withDevice('/me/player/pause', deviceId))
  },

  /** PUT /v1/me/player/seek?position_ms=. */
  seek(accessToken: string, deviceId: string, positionMs: number): Promise<void> {
    return command(accessToken, 'PUT', withDevice('/me/player/seek', deviceId, { position_ms: String(Math.max(0, Math.round(positionMs))) }))
  },

  /** PUT /v1/me/player/volume?volume_percent= (solo si el dispositivo lo admite). */
  volume(accessToken: string, deviceId: string, percent: number): Promise<void> {
    return command(accessToken, 'PUT', withDevice('/me/player/volume', deviceId, { volume_percent: String(Math.round(percent)) }))
  },

  /** GET /v1/me/player/devices: dispositivos de Spotify Connect de la cuenta. */
  async devices(accessToken: string): Promise<SpotifyDevice[]> {
    const response = await fetch(`${API}/me/player/devices`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) throw new SpotifyError(response.status, 'No se pudieron leer tus dispositivos de Spotify.')
    return ((await response.json()) as { devices: SpotifyDevice[] }).devices
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
