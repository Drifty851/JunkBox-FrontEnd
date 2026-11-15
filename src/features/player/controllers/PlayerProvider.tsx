import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/controllers/authContext'
import { spotifyApi, SpotifyError } from '../infrastructure/spotifyApi'
import { loadSpotifySdk, type SdkPlaybackState, type SdkPlayer } from '../infrastructure/spotifyPlaybackSdk'
import { INITIAL_PLAYER_STATE, type PlayerNotice, type PlayerState } from '../models/player'
import { spotifyAuthService } from '../services/spotifyAuthService'
import { PlayerContext, type PlayerContextValue } from './playerContext'

const NOTICES: Record<PlayerNotice['kind'], string> = {
  unlinked: 'Vincula tu cuenta de Spotify Premium en Configuración para reproducir.',
  'not-premium': 'Para reproducir en Junkbox necesitas Spotify Premium.',
  error: 'Spotify no pudo reproducir la canción. Inténtalo de nuevo.',
}

const notice = (kind: PlayerNotice['kind'], message = NOTICES[kind]): PlayerNotice => ({ kind, message })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Esperas entre reintentos ante "Device not found". */
const RETRY_DELAYS_MS = [800, 1600, 3200]

/**
 * Reproductor global (vive en src/app/App.tsx, por encima de las rutas, para que la música siga al
 * cambiar de pantalla; se desconecta al cerrar sesión). Usa el Web Playback SDK de Spotify: Junkbox aparece como un dispositivo de Spotify y la
 * canción se pide con PUT /v1/me/player/play. Requiere la vinculación de Configuración (§11.1).
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<PlayerState>(INITIAL_PLAYER_STATE)

  const playerRef = useRef<SdkPlayer | null>(null)
  const deviceRef = useRef<Promise<string> | null>(null)
  const premiumRef = useRef<boolean | null>(null)
  const volumeRef = useRef(INITIAL_PLAYER_STATE.volume)
  const lastPositionRef = useRef(0)

  const update = useCallback((patch: Partial<PlayerState>) => setState((current) => ({ ...current, ...patch })), [])

  const onSdkState = useCallback((sdk: SdkPlaybackState | null) => {
    if (!sdk) return
    const track = sdk.track_window.current_track
    // Con una sola canción, al terminar Spotify pausa y vuelve la posición a 0.
    const ended = sdk.paused && sdk.position === 0 && sdk.duration > 0 && lastPositionRef.current > sdk.duration - 2500
    lastPositionRef.current = sdk.position
    setState((current) => {
      // Terminada (sola o con "Adelante") y en pausa: la barra se queda llena.
      const stillEnded = ended || (current.ended && sdk.paused)
      return {
        ...current,
        loading: false,
        paused: sdk.paused,
        ended: stillEnded,
        positionMs: stillEnded ? sdk.duration : sdk.position,
        durationMs: sdk.duration,
        track: track
          ? {
              spotifyId: track.id ?? current.track?.spotifyId ?? '',
              title: track.name,
              artist: track.artists.map((artist) => artist.name).join(', '),
              imageUrl: track.album.images[0]?.url ?? null,
            }
          : current.track,
      }
    })
  }, [])

  /** Crea (una vez) el reproductor del SDK y espera a que Spotify le asigne un dispositivo. */
  const ensureDevice = useCallback(
    (forUser: string): Promise<string> => {
      if (deviceRef.current) return deviceRef.current
      deviceRef.current = (async () => {
        const Spotify = await loadSpotifySdk()
        const player = new Spotify.Player({
          name: 'Junkbox',
          volume: volumeRef.current / 100,
          getOAuthToken: (callback) => {
            spotifyAuthService
              .getAccessToken(forUser)
              .then(callback)
              .catch(() => update({ loading: false, notice: notice('unlinked') }))
          },
        })
        playerRef.current = player
        const ready = new Promise<string>((resolve, reject) => {
          player.addListener('ready', ({ device_id }) => resolve(device_id))
          player.addListener('initialization_error', ({ message }) => reject(new Error(message)))
          player.addListener('account_error', () => reject(new SpotifyError(403, NOTICES['not-premium'])))
          setTimeout(() => reject(new Error('Spotify tardó demasiado en preparar el reproductor.')), 15000)
        })
        player.addListener('player_state_changed', onSdkState)
        player.addListener('account_error', () => update({ loading: false, notice: notice('not-premium') }))
        player.addListener('authentication_error', () => update({ loading: false, notice: notice('unlinked') }))
        player.addListener('playback_error', () => update({ loading: false, notice: notice('error') }))
        player.addListener('not_ready', () => {
          // Spotify dio el dispositivo por desconectado: se descarta para no tener dos reproductores.
          player.disconnect()
          if (playerRef.current === player) playerRef.current = null
          deviceRef.current = null
        })
        if (!(await player.connect())) throw new Error('No se pudo conectar el reproductor de Spotify.')
        const deviceId = await ready
        // Registrar el dispositivo en la cuenta antes de pedir canciones (evita "Device not found").
        await spotifyApi.transfer(await spotifyAuthService.getAccessToken(forUser), deviceId).catch(() => undefined)
        return deviceId
      })()
      deviceRef.current.catch(() => {
        playerRef.current?.disconnect()
        playerRef.current = null
        deviceRef.current = null
      })
      return deviceRef.current
    },
    [onSdkState, update],
  )

  const play = useCallback(
    (spotifyId: string) => {
      if (!userId) return
      // Dentro del gesto del usuario: desbloquea el audio en navegadores estrictos.
      void playerRef.current?.activateElement()
      update({ visible: true, loading: true, notice: null, ended: false, positionMs: 0 })
      if (!spotifyAuthService.hasLink(userId)) {
        update({ loading: false, notice: notice('unlinked') })
        return
      }
      void (async () => {
        try {
          if (premiumRef.current === null) {
            premiumRef.current = (await spotifyAuthService.getProfile(userId)).product === 'premium'
          }
          if (!premiumRef.current) {
            update({ loading: false, notice: notice('not-premium') })
            return
          }
          const deviceId = await ensureDevice(userId)
          const token = await spotifyAuthService.getAccessToken(userId)
          // El dispositivo recién creado puede tardar en registrarse en Spotify ("Device not found",
          // 404): hasta 3 reintentos con espera creciente.
          for (let attempt = 0; ; attempt++) {
            try {
              await spotifyApi.play(token, deviceId, spotifyId)
              break
            } catch (error) {
              if (!(error instanceof SpotifyError && error.status === 404) || attempt >= RETRY_DELAYS_MS.length) throw error
              await sleep(RETRY_DELAYS_MS[attempt])
            }
          }
          lastPositionRef.current = 0
        } catch (error) {
          const kind =
            error instanceof SpotifyError && error.status === 403
              ? 'not-premium'
              : error instanceof SpotifyError && error.status === 401 && !spotifyAuthService.hasLink(userId)
                ? 'unlinked'
                : 'error'
          update({
            loading: false,
            notice: notice(kind, kind === 'error' && error instanceof Error ? error.message : undefined),
          })
        }
      })()
    },
    [userId, ensureDevice, update],
  )

  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (state.ended) {
      update({ ended: false, positionMs: 0 })
      lastPositionRef.current = 0
      void player.seek(0).then(() => player.resume())
      return
    }
    void player.togglePlay()
  }, [state.ended, update])

  /** "Atrás": la barra se vacía al instante y la canción vuelve a sonar desde 0. */
  const restart = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    lastPositionRef.current = 0
    update({ ended: false, paused: false, positionMs: 0 })
    void player.seek(0).then(() => player.resume())
  }, [update])

  /** Barra de tiempo: mueve la canción a `positionMs` (si había terminado, queda en pausa ahí). */
  const seek = useCallback(
    (positionMs: number) => {
      const player = playerRef.current
      if (!player) return
      const value = Math.max(0, Math.round(positionMs))
      lastPositionRef.current = value
      update({ ended: false, positionMs: value })
      void player.seek(value)
    },
    [update],
  )

  /** "Adelante": pausa y deja la barra llena (ended); onSdkState ya no la vacía. */
  const finish = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    void player.pause()
    setState((current) => ({ ...current, paused: true, ended: true, positionMs: current.durationMs }))
  }, [])

  const setVolume = useCallback(
    (volume: number) => {
      const value = Math.min(100, Math.max(0, Math.round(volume)))
      volumeRef.current = value
      update({ volume: value })
      void playerRef.current?.setVolume(value / 100)
    },
    [update],
  )

  const close = useCallback(() => {
    void playerRef.current?.pause()
    update({ visible: false, expanded: false, notice: null, loading: false })
  }, [update])

  const setExpanded = useCallback((expanded: boolean) => update({ expanded }), [update])

  // Progreso: mientras suena, se lee la posición del SDK dos veces por segundo.
  useEffect(() => {
    if (!state.visible || state.paused) return
    const timer = window.setInterval(() => {
      void playerRef.current?.getCurrentState().then((sdk) => {
        if (!sdk) return
        lastPositionRef.current = sdk.position
        setState((current) => (current.ended ? current : { ...current, positionMs: sdk.position, durationMs: sdk.duration }))
      })
    }, 500)
    return () => window.clearInterval(timer)
  }, [state.visible, state.paused])

  // Al cerrar sesión (AppLayout se desmonta) o cambiar de usuario, se desconecta el dispositivo.
  useEffect(
    () => () => {
      playerRef.current?.disconnect()
      playerRef.current = null
      deviceRef.current = null
      premiumRef.current = null
      lastPositionRef.current = 0
      volumeRef.current = INITIAL_PLAYER_STATE.volume
      // Reinicio del estado al cerrar sesión o cambiar de usuario (fuera de un setState síncrono del efecto).
      queueMicrotask(() => setState(INITIAL_PLAYER_STATE))
    },
    [userId],
  )

  const value = useMemo<PlayerContextValue>(
    () => ({ state, play, togglePlay, restart, seek, finish, setVolume, close, setExpanded }),
    [state, play, togglePlay, restart, seek, finish, setVolume, close, setExpanded],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
