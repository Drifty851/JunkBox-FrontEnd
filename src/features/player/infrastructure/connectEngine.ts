import { NoDeviceError, type EngineSnapshot, type PlaybackEngine, type PlaybackTarget } from '../models/playback'
import type { SpotifyDevice } from '../models/spotify'
import { spotifyApi, SpotifyError } from './spotifyApi'

/** Tipos de dispositivo de Spotify que corresponden a "este teléfono o tableta". */
const HANDHELD = new Set(['smartphone', 'tablet'])

/**
 * El teléfono o la tableta en el que suena la música: el activo de esos tipos o, si no hay, el
 * primero. La Web API no dice cuál es "este" dispositivo; si hay varios, el activo es el que el
 * usuario tiene en la mano.
 */
function pickDevice(devices: SpotifyDevice[]): SpotifyDevice | null {
  const handheld = devices.filter((device) => device.id && HANDHELD.has(device.type.toLowerCase()))
  return handheld.find((device) => device.is_active) ?? handheld[0] ?? null
}

const toTarget = (device: SpotifyDevice): PlaybackTarget => ({
  deviceId: device.id ?? '',
  deviceName: device.name,
  supportsVolume: device.supports_volume,
})

/**
 * Motor de Spotify Connect (teléfonos y tabletas, decisión del propietario, 2026-11-19): la música
 * suena en la app de Spotify del dispositivo y Junkbox la controla con la Web API
 * (scopes user-read-playback-state y user-modify-playback-state, que ya pide la vinculación).
 * No hay eventos: el estado se lee con GET /v1/me/player (cada 1 s mientras suena, cada 5 s en
 * pausa), así que también se reflejan los cambios hechos desde la app de Spotify.
 */
export function createConnectEngine(getToken: () => Promise<string>): PlaybackEngine {
  let target: PlaybackTarget | null = null

  async function prepare(): Promise<PlaybackTarget> {
    const device = pickDevice(await spotifyApi.devices(await getToken()))
    if (!device) throw new NoDeviceError()
    target = toTarget(device)
    return target
  }

  /** Orden al dispositivo elegido; si Spotify ya no lo encuentra (app cerrada), avisa. */
  async function send(action: (token: string, deviceId: string) => Promise<void>): Promise<void> {
    const current = target ?? (await prepare())
    try {
      await action(await getToken(), current.deviceId)
    } catch (error) {
      if (error instanceof SpotifyError && error.status === 404) {
        target = null
        throw new NoDeviceError()
      }
      throw error
    }
  }

  return {
    mode: 'connect',
    unlockAudio: () => undefined,
    prepare,
    async play(spotifyId, positionMs = 0) {
      // Se vuelve a elegir el dispositivo en cada canción: la app pudo cerrarse o cambiar.
      await prepare()
      await send((token, deviceId) => spotifyApi.play(token, deviceId, spotifyId, positionMs))
    },
    pause: () => send((token, deviceId) => spotifyApi.pause(token, deviceId)),
    resume: () => send((token, deviceId) => spotifyApi.resume(token, deviceId)),
    seek: (positionMs) => send((token, deviceId) => spotifyApi.seek(token, deviceId, positionMs)),
    async setVolume(volume) {
      if (target && !target.supportsVolume) return
      await send((token, deviceId) => spotifyApi.volume(token, deviceId, volume))
    },
    async readState(): Promise<EngineSnapshot | null> {
      const playback = await spotifyApi.currentPlayback(await getToken()).catch(() => undefined)
      if (playback === undefined) return null
      const item = playback?.item ?? null
      return {
        // Sin reproducción (204) o en otro dispositivo: la música ya no está en este teléfono.
        active: playback !== null && target !== null && playback.device.id === target.deviceId,
        paused: !playback?.is_playing,
        positionMs: playback?.progress_ms ?? 0,
        durationMs: item?.duration_ms ?? 0,
        track: item
          ? {
              spotifyId: item.id,
              title: item.name,
              artist: item.artists.map((artist) => artist.name).join(', '),
              imageUrl: item.album.images[0]?.url ?? null,
            }
          : null,
      }
    },
    pollInterval: (paused) => (paused ? 5000 : 1000),
    dispose() {
      target = null
    },
  }
}
