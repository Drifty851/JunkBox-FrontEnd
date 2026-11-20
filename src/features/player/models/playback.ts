import type { NowPlaying, PlayerNotice } from './player'

/**
 * Motores de reproducción (decisión del propietario, 2026-11-19): la misma interfaz del MiniPlayer
 * con distintas fuentes de sonido.
 *  - `sdk`: Web Playback SDK, la música suena en la pestaña (escritorio).
 *  - `connect`: Spotify Connect, la música suena en la app de Spotify del teléfono o la tablet y
 *    Junkbox la controla con la Web API.
 */
export type PlaybackMode = 'sdk' | 'connect'

/** Dispositivo de Spotify en el que suena la música. */
export interface PlaybackTarget {
  deviceId: string
  /** "Junkbox" (SDK) o el nombre del teléfono o la tablet (Connect). */
  deviceName: string
  /** iOS no deja cambiar el volumen de la app de Spotify desde la Web API. */
  supportsVolume: boolean
}

/** Lectura del estado de la reproducción. */
export interface EngineSnapshot {
  /** La música suena en el dispositivo de este motor. Si es false, otro dispositivo la tomó. */
  active: boolean
  paused: boolean
  positionMs: number
  durationMs: number
  track: NowPlaying | null
}

/** Errores que el reproductor muestra como aviso. */
export type EngineErrorKind = PlayerNotice['kind']

export interface EngineCallbacks {
  /** Cambio de estado avisado por el propio motor (el SDK; Connect solo se lee con `readState`). */
  onState: (snapshot: EngineSnapshot) => void
  onError: (kind: EngineErrorKind) => void
}

export interface PlaybackEngine {
  readonly mode: PlaybackMode
  /** Dentro del gesto del usuario: desbloquea el audio en navegadores estrictos (solo el SDK). */
  unlockAudio: () => void
  /** Prepara el dispositivo donde va a sonar (crea el del SDK o elige el teléfono en Connect). */
  prepare: () => Promise<PlaybackTarget>
  play: (spotifyId: string, positionMs?: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  /** 0–100. */
  setVolume: (volume: number) => Promise<void>
  /** Estado actual; null si no se pudo leer (no cambia nada). */
  readState: () => Promise<EngineSnapshot | null>
  /** Cada cuánto leer el estado (ms) según esté sonando o en pausa; null = no leer. */
  pollInterval: (paused: boolean) => number | null
  dispose: () => void
}

/** El navegador no puede usar el SDK (lo dice el propio SDK): se pasa a Spotify Connect. */
export class EngineUnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUnsupportedError'
  }
}

/**
 * Connect no encontró la app de Spotify en este teléfono o tableta: iOS y Android duermen las apps
 * en segundo plano y una página web no puede despertarlas. El MiniPlayer ofrece abrir la canción en
 * la app ("Abrir en Spotify") y la vuelve a pedir al regresar a Junkbox (2026-11-19).
 */
export class NoDeviceError extends Error {
  constructor() {
    super('Spotify está dormido en este dispositivo. Abre la canción en Spotify y, al volver, la controlas desde aquí.')
    this.name = 'NoDeviceError'
  }
}
