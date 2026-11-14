/**
 * Web Playback SDK de Spotify (https://developer.spotify.com/documentation/web-playback-sdk).
 * Se carga una sola vez desde el CDN de Spotify. Solo funciona con cuentas Premium.
 * Tipos mínimos escritos a mano (solo lo que usa Junkbox), sin dependencias nuevas.
 */

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'

export interface SdkTrack {
  id: string | null
  uri: string
  name: string
  duration_ms: number
  artists: { name: string; uri: string }[]
  album: { name: string; images: { url: string; width?: number | null }[] }
}

export interface SdkPlaybackState {
  paused: boolean
  position: number
  duration: number
  loading?: boolean
  track_window: { current_track: SdkTrack | null }
}

type ErrorListener = (error: { message: string }) => void

export interface SdkPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: 'ready' | 'not_ready', listener: (data: { device_id: string }) => void): boolean
  addListener(event: 'player_state_changed', listener: (state: SdkPlaybackState | null) => void): boolean
  addListener(
    event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
    listener: ErrorListener,
  ): boolean
  getCurrentState(): Promise<SdkPlaybackState | null>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(positionMs: number): Promise<void>
  /** Desbloquea el audio en navegadores que exigen un gesto del usuario (Safari, móviles). */
  activateElement(): Promise<void>
}

interface SdkNamespace {
  Player: new (options: {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume?: number
  }) => SdkPlayer
}

declare global {
  interface Window {
    Spotify?: SdkNamespace
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

let loading: Promise<SdkNamespace> | null = null

/** Carga el SDK (una sola vez) y devuelve el espacio de nombres `Spotify`. */
export function loadSpotifySdk(): Promise<SdkNamespace> {
  if (window.Spotify) return Promise.resolve(window.Spotify)
  if (!loading) {
    loading = new Promise<SdkNamespace>((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (window.Spotify) resolve(window.Spotify)
        else reject(new Error('El SDK de Spotify no se inicializó.'))
      }
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      script.onerror = () => {
        loading = null
        reject(new Error('No se pudo cargar el reproductor de Spotify. Revisa tu conexión o el bloqueador de anuncios.'))
      }
      document.body.appendChild(script)
    })
  }
  return loading
}
