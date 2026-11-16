/**
 * Modelo del reproductor (MiniPlayer de Figma + Web Playback SDK).
 * Reglas del propietario (2026-11-13):
 *  - Una sola canción: la que elige el usuario.
 *  - "Atrás" reinicia la canción; "Adelante" la termina (queda al final, en pausa).
 *  - Volumen de 0 a 100 que empieza siempre en 50.
 *  - La X detiene y oculta el reproductor.
 */

export const INITIAL_VOLUME = 50

/** Canción que suena (datos del SDK de Spotify). */
export interface NowPlaying {
  spotifyId: string
  title: string
  artist: string
  imageUrl: string | null
}

/** Aviso en lugar de la canción: sin vincular, sin Premium o error de Spotify. */
export interface PlayerNotice {
  kind: 'unlinked' | 'not-premium' | 'error'
  message: string
}

/**
 * Spotify solo deja sonar un dispositivo a la vez por cuenta. Si ya suena en otro, antes de
 * reproducir se pregunta si se quiere cambiar a esta pestaña (decisión del propietario, 2026-11-15).
 */
export interface PendingSwitch {
  spotifyId: string
  /** Nombre del dispositivo que suena ("Junkbox" si es otra pestaña). */
  deviceName: string
}

export interface PlayerState {
  /** El MiniPlayer está a la vista (se oculta con la X). */
  visible: boolean
  /** Preparando el reproductor o pidiendo la canción a Spotify. */
  loading: boolean
  track: NowPlaying | null
  paused: boolean
  /** La canción llegó al final (o se pulsó "Adelante"). */
  ended: boolean
  positionMs: number
  durationMs: number
  /** 0–100. */
  volume: number
  /** Vista ampliada (flecha del MiniPlayer). */
  expanded: boolean
  notice: PlayerNotice | null
  pendingSwitch: PendingSwitch | null
}

export const INITIAL_PLAYER_STATE: PlayerState = {
  visible: false,
  loading: false,
  track: null,
  paused: true,
  ended: false,
  positionMs: 0,
  durationMs: 0,
  volume: INITIAL_VOLUME,
  expanded: false,
  notice: null,
  pendingSwitch: null,
}

/** "m:ss" para los tiempos del MiniPlayer (Figma: "0:58", "3:24"). */
export function formatPlaybackTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
