import { EngineUnsupportedError, type EngineCallbacks, type EngineSnapshot, type PlaybackEngine, type PlaybackTarget } from '../models/playback'
import { PREMIUM_REQUIRED, spotifyApi, SpotifyError } from './spotifyApi'
import { loadSpotifySdk, type SdkPlaybackState, type SdkPlayer } from './spotifyPlaybackSdk'

/** Nombre del dispositivo del SDK en la cuenta de Spotify. */
export const SDK_DEVICE_NAME = 'Junkbox'
/** Esperas entre reintentos ante "Device not found". */
const RETRY_DELAYS_MS = [800, 1600, 3200]
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function toSnapshot(sdk: SdkPlaybackState): EngineSnapshot {
  const track = sdk.track_window.current_track
  return {
    active: true,
    paused: sdk.paused,
    positionMs: sdk.position,
    durationMs: sdk.duration,
    track: track
      ? {
          spotifyId: track.id ?? '',
          title: track.name,
          artist: track.artists.map((artist) => artist.name).join(', '),
          imageUrl: track.album.images[0]?.url ?? null,
        }
      : null,
  }
}

const INACTIVE: EngineSnapshot = { active: false, paused: true, positionMs: 0, durationMs: 0, track: null }

/**
 * Motor del Web Playback SDK (escritorio): Junkbox aparece como un dispositivo de Spotify y la
 * música suena en la pestaña. Es el comportamiento de §11.2, movido aquí desde PlayerProvider.
 */
export function createSdkEngine(getToken: () => Promise<string>, initialVolume: number, callbacks: EngineCallbacks): PlaybackEngine {
  let player: SdkPlayer | null = null
  let device: Promise<PlaybackTarget> | null = null

  /** Crea (una vez) el reproductor del SDK y espera a que Spotify le asigne un dispositivo. */
  function prepare(): Promise<PlaybackTarget> {
    if (device) return device
    device = (async () => {
      const Spotify = await loadSpotifySdk()
      const created = new Spotify.Player({
        name: SDK_DEVICE_NAME,
        volume: initialVolume / 100,
        getOAuthToken: (callback) => {
          getToken()
            .then(callback)
            .catch(() => callbacks.onError('unlinked'))
        },
      })
      player = created
      const ready = new Promise<string>((resolve, reject) => {
        created.addListener('ready', ({ device_id }) => resolve(device_id))
        // El navegador no admite el SDK (teléfonos, tabletas): el reproductor pasa a Connect.
        created.addListener('initialization_error', ({ message }) => reject(new EngineUnsupportedError(message)))
        created.addListener('account_error', () => reject(new SpotifyError(403, 'Para reproducir en Junkbox necesitas Spotify Premium.', PREMIUM_REQUIRED)))
        setTimeout(() => reject(new Error('Spotify tardó demasiado en preparar el reproductor.')), 15000)
      })
      created.addListener('player_state_changed', (sdk) => callbacks.onState(sdk ? toSnapshot(sdk) : INACTIVE))
      created.addListener('account_error', () => callbacks.onError('not-premium'))
      created.addListener('authentication_error', () => callbacks.onError('unlinked'))
      created.addListener('playback_error', () => callbacks.onError('error'))
      created.addListener('not_ready', () => {
        // Spotify dio el dispositivo por desconectado: se descarta para no tener dos reproductores.
        created.disconnect()
        if (player === created) player = null
        device = null
      })
      if (!(await created.connect())) throw new Error('No se pudo conectar el reproductor de Spotify.')
      const deviceId = await ready
      // Registrar el dispositivo en la cuenta antes de pedir canciones (evita "Device not found").
      await spotifyApi.transfer(await getToken(), deviceId).catch(() => undefined)
      return { deviceId, deviceName: SDK_DEVICE_NAME, supportsVolume: true }
    })()
    device.catch(() => {
      player?.disconnect()
      player = null
      device = null
    })
    return device
  }

  return {
    mode: 'sdk',
    unlockAudio: () => void player?.activateElement(),
    prepare,
    async play(spotifyId, positionMs = 0) {
      const { deviceId } = await prepare()
      const token = await getToken()
      // El dispositivo recién creado puede tardar en registrarse en Spotify ("Device not found",
      // 404): hasta 3 reintentos con espera creciente.
      for (let attempt = 0; ; attempt++) {
        try {
          await spotifyApi.play(token, deviceId, spotifyId, positionMs)
          return
        } catch (error) {
          if (!(error instanceof SpotifyError && error.status === 404) || attempt >= RETRY_DELAYS_MS.length) throw error
          await sleep(RETRY_DELAYS_MS[attempt])
        }
      }
    },
    pause: async () => player?.pause(),
    resume: async () => player?.resume(),
    seek: async (positionMs) => player?.seek(positionMs),
    setVolume: async (volume) => player?.setVolume(volume / 100),
    async readState() {
      const sdk = await player?.getCurrentState()
      // Sin estado, el SDK ya avisó por `player_state_changed`: no se cambia nada.
      return sdk ? toSnapshot(sdk) : null
    },
    // Mientras suena, la posición se lee dos veces por segundo; en pausa avisa el propio SDK.
    pollInterval: (paused) => (paused ? null : 500),
    dispose() {
      player?.disconnect()
      player = null
      device = null
    },
  }
}
