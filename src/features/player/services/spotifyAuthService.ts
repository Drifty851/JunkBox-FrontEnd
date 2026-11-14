import { spotifyApi, SpotifyError } from '../infrastructure/spotifyApi'
import { spotifyTokenVault } from '../infrastructure/spotifyTokenVault'
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_LINK_ORIGIN,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  type SpotifyProfile,
} from '../models/spotify'

/** Datos del flujo en curso (solo durante la ida y vuelta a Spotify, en sessionStorage). */
const PENDING_KEY = 'junkbox.spotify.pending'

interface PendingLink {
  state: string
  verifier: string
  userId: string
  /** Pantalla a la que se vuelve al terminar. */
  returnTo: string
}

/** Access token en memoria (nunca se guarda). */
let memory: { userId: string; token: string; expiresAt: number } | null = null
let refreshing: Promise<string> | null = null

function randomString(bytes: number): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...values)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function remember(userId: string, token: string, expiresIn: number) {
  // Se renueva un minuto antes de que caduque.
  memory = { userId, token, expiresAt: Date.now() + (expiresIn - 60) * 1000 }
}

/** Casos de uso de la vinculación con Spotify (PKCE). */
export const spotifyAuthService = {
  /** Hay Client ID configurado en .env.local. */
  isConfigured(): boolean {
    return SPOTIFY_CLIENT_ID !== ''
  },

  /** La vinculación tiene que empezar en el mismo origen que la URL de retorno (127.0.0.1). */
  isOnLinkOrigin(): boolean {
    return window.location.origin === SPOTIFY_LINK_ORIGIN
  },

  linkOrigin: SPOTIFY_LINK_ORIGIN,

  hasLink(userId: string): boolean {
    return spotifyTokenVault.hasLink(userId)
  },

  /** Inicia la vinculación: genera verifier y state y redirige a Spotify. */
  async startLink(userId: string, returnTo: string): Promise<void> {
    const verifier = randomString(64)
    const pending: PendingLink = { state: randomString(16), verifier, userId, returnTo }
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SPOTIFY_SCOPES.join(' '),
      code_challenge_method: 'S256',
      code_challenge: await challengeFor(verifier),
      state: pending.state,
    })
    window.location.assign(`${spotifyApi.authorizeUrl}?${params.toString()}`)
  },

  /**
   * Termina la vinculación en /spotify/callback: comprueba el `state`, cambia el código por los
   * tokens y guarda el refresh token cifrado. Devuelve a dónde volver.
   */
  async completeLink(search: string, userId: string): Promise<string> {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    const params = new URLSearchParams(search)
    const pending = raw ? (JSON.parse(raw) as PendingLink) : null
    if (params.get('error') === 'access_denied') throw new Error('Cancelaste la vinculación con Spotify.')
    if (!pending || pending.state !== params.get('state') || pending.userId !== userId) {
      throw new Error('La vinculación no es válida o caducó. Vuelve a intentarlo desde Configuración.')
    }
    const code = params.get('code')
    if (!code) throw new Error('Spotify no devolvió la autorización. Vuelve a intentarlo.')
    const tokens = await spotifyApi.exchangeCode(SPOTIFY_CLIENT_ID, code, SPOTIFY_REDIRECT_URI, pending.verifier)
    if (!tokens.refresh_token) throw new Error('Spotify no devolvió el permiso para mantener la vinculación.')
    await spotifyTokenVault.saveRefreshToken(userId, tokens.refresh_token)
    remember(userId, tokens.access_token, tokens.expires_in)
    return pending.returnTo
  },

  /**
   * Access token vigente: el de memoria o uno nuevo con el refresh token guardado. Una sola
   * renovación a la vez. Si Spotify revoca la vinculación (400/401), se borra.
   */
  async getAccessToken(userId: string): Promise<string> {
    if (memory && memory.userId === userId && Date.now() < memory.expiresAt) return memory.token
    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = await spotifyTokenVault.readRefreshToken(userId)
        if (!refreshToken) throw new SpotifyError(401, 'Spotify no está vinculado.')
        try {
          const tokens = await spotifyApi.refresh(SPOTIFY_CLIENT_ID, refreshToken)
          if (tokens.refresh_token) await spotifyTokenVault.saveRefreshToken(userId, tokens.refresh_token)
          remember(userId, tokens.access_token, tokens.expires_in)
          return tokens.access_token
        } catch (error) {
          if (error instanceof SpotifyError && (error.status === 400 || error.status === 401)) {
            spotifyTokenVault.clear(userId)
          }
          throw error
        }
      })().finally(() => {
        refreshing = null
      })
    }
    return refreshing
  },

  /** Perfil de Spotify del usuario vinculado (para mostrarlo y saber si es Premium). */
  async getProfile(userId: string): Promise<SpotifyProfile> {
    return spotifyApi.me(await this.getAccessToken(userId))
  },

  /** Desvincula en este navegador (borra el token guardado y el de memoria). */
  unlink(userId: string): void {
    spotifyTokenVault.clear(userId)
    if (memory?.userId === userId) memory = null
  },
}
