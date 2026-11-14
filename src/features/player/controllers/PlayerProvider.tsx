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

/**
 * Reproductor global de las pantallas con sesión (envuelve AppLayout, así que se detiene al cerrar
 * sesión). Usa el Web Playback SDK de Spotify: Junkbox aparece como un dispositivo de Spotify y la
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
    setState((current) => ({
      ...current,
      loading: false,
      paused: sdk.paused,
      ended: ended || (current.ended && sdk.paused),
      positionMs: ended ? sdk.duration : sdk.position,
      durationMs: sdk.duration,
      track: track
        ? {
            spotifyId: track.id ?? current.track?.spotifyId ?? '',
            title: track.name,
            artist: track.artists.map((artist) => artist.name).join(', '),
            imageUrl: track.album.images[0]?.url ?? null,
          }
        : current.track,
    }))
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
          deviceRef.current = null
        })
        if (!(await player.connect())) throw new Error('No se pudo conectar el reproductor de Spotify.')
        return ready
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
          try {
            await spotifyApi.play(token, deviceId, spotifyId)
          } catch (error) {
            // El dispositivo recién creado a veces tarda en registrarse en Spotify: un reintento.
            if (!(error instanceof SpotifyError && error.status === 404)) throw error
            await sleep(1200)
            await spotifyApi.play(token, deviceId, spotifyId)
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

  const restart = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    lastPositionRef.current = 0
    update({ ended: false, positionMs: 0 })
    void player.seek(0)
  }, [update])

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
        setState((current) => ({ ...current, positionMs: sdk.position, durationMs: sdk.duration }))
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
    },
    [userId],
  )

  const value = useMemo<PlayerContextValue>(
    () => ({ state, play, togglePlay, restart, finish, setVolume, close, setExpanded }),
    [state, play, togglePlay, restart, finish, setVolume, close, setExpanded],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
