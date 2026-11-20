import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/controllers/authContext'
import { createConnectEngine } from '../infrastructure/connectEngine'
import { createSdkEngine } from '../infrastructure/sdkEngine'
import { spotifyApi, SpotifyError } from '../infrastructure/spotifyApi'
import { EngineUnsupportedError, NoDeviceError, type EngineSnapshot, type PlaybackEngine, type PlaybackMode, type PlaybackTarget } from '../models/playback'
import { INITIAL_PLAYER_STATE, type PlayerNotice, type PlayerState } from '../models/player'
import { detectPlaybackMode } from '../services/playbackMode'
import { spotifyAuthService } from '../services/spotifyAuthService'
import { PlayerContext, type PlayerContextValue } from './playerContext'

const NOTICES: Record<PlayerNotice['kind'], string> = {
  unlinked: 'Vincula tu cuenta de Spotify Premium en Configuración para reproducir.',
  'not-premium': 'Para reproducir en Junkbox necesitas Spotify Premium.',
  'no-device': new NoDeviceError().message,
  error: 'Spotify no pudo reproducir la canción. Inténtalo de nuevo.',
}

const notice = (kind: PlayerNotice['kind'], message = NOTICES[kind]): PlayerNotice => ({ kind, message })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Connect: la app de Spotify tarda un momento en empezar; después se lee el estado. */
const CONNECT_SETTLE_MS = 700
/**
 * Connect: tras una orden (pausa, "Adelante", barra…), las lecturas que salieron antes o en este
 * margen pueden traer el estado anterior y deshacer lo que ya muestra el MiniPlayer: se descartan.
 */
const COMMAND_GRACE_MS = 900

/** Aviso que corresponde a un error de Spotify o del motor. */
function noticeFor(error: unknown, linked: boolean, spotifyId: string | null): PlayerNotice {
  if (error instanceof NoDeviceError) return { ...notice('no-device'), spotifyId: spotifyId ?? undefined }
  if (error instanceof SpotifyError && error.premiumRequired) return notice('not-premium')
  if (error instanceof SpotifyError && error.status === 401 && !linked) return notice('unlinked')
  // Los mensajes de la Web API vienen en inglés ("Restriction violated"): se usa el aviso general.
  if (error instanceof SpotifyError) return notice('error')
  return notice('error', error instanceof Error ? error.message : undefined)
}

/**
 * Reproductor global (vive en src/app/App.tsx, por encima de las rutas, para que la música siga al
 * cambiar de pantalla; se reinicia al cerrar sesión). Requiere la vinculación de Configuración
 * (§11.1) y Spotify Premium. La música suena con uno de dos motores (§11.3, 2026-11-19):
 *  - Escritorio: Web Playback SDK, en la pestaña (`sdkEngine`).
 *  - Teléfonos y tabletas: Spotify Connect, en la app de Spotify del dispositivo (`connectEngine`).
 * El MiniPlayer es el mismo en los dos casos.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<PlayerState>(INITIAL_PLAYER_STATE)

  const engineRef = useRef<PlaybackEngine | null>(null)
  const modeRef = useRef<PlaybackMode | null>(null)
  const premiumRef = useRef<boolean | null>(null)
  const volumeRef = useRef(INITIAL_PLAYER_STATE.volume)
  const lastPositionRef = useRef(0)
  /** Última canción pedida (para "Abrir en Spotify" si la app está dormida). */
  const requestedRef = useRef<string | null>(null)
  /** Momento de la última orden del usuario (pausa, barra, atrás, adelante, volumen). */
  const lastCommandRef = useRef(0)
  /**
   * La música suena en el dispositivo de este motor (esta pestaña o, con Connect, este teléfono).
   * Si otro dispositivo la tomó (o se pulsó "Cancelar"), los controles no sirven: reproducir
   * vuelve a preguntar.
   */
  const activeRef = useRef(false)

  const update = useCallback((patch: Partial<PlayerState>) => setState((current) => ({ ...current, ...patch })), [])

  const applySnapshot = useCallback((snapshot: EngineSnapshot) => {
    if (!snapshot.active) {
      // Otra pestaña, otro dispositivo o la app de Spotify tomó la música: el MiniPlayer sigue a la
      // vista con la canción en pausa (decisión del propietario, 2026-11-15).
      activeRef.current = false
      setState((current) => (current.track ? { ...current, paused: true, loading: false } : current))
      return
    }
    activeRef.current = true
    const { paused, positionMs, durationMs } = snapshot
    // Con una sola canción, al terminar Spotify pausa y vuelve la posición a 0 (SDK) o la deja al
    // final (Connect).
    const ended =
      paused && durationMs > 0 && ((positionMs === 0 && lastPositionRef.current > durationMs - 2500) || positionMs >= durationMs - 1500)
    lastPositionRef.current = positionMs
    setState((current) => {
      // Terminada (sola o con "Adelante") y en pausa: la barra se queda llena.
      const stillEnded = ended || (current.ended && paused)
      return {
        ...current,
        loading: false,
        paused,
        ended: stillEnded,
        positionMs: stillEnded ? durationMs : positionMs,
        durationMs,
        track: snapshot.track ? { ...snapshot.track, spotifyId: snapshot.track.spotifyId || current.track?.spotifyId || '' } : current.track,
      }
    })
  }, [])

  const showError = useCallback(
    (error: unknown) =>
      update({ loading: false, notice: noticeFor(error, userId !== null && spotifyAuthService.hasLink(userId), requestedRef.current) }),
    [update, userId],
  )

  /** Motor de este dispositivo (se crea una vez por sesión). */
  const getEngine = useCallback(
    (forUser: string): PlaybackEngine => {
      if (engineRef.current) return engineRef.current
      const mode = modeRef.current ?? detectPlaybackMode()
      modeRef.current = mode
      const getToken = () => spotifyAuthService.getAccessToken(forUser)
      engineRef.current =
        mode === 'sdk'
          ? createSdkEngine(getToken, volumeRef.current, {
              onState: applySnapshot,
              onError: (kind) => update({ loading: false, notice: notice(kind) }),
            })
          : createConnectEngine(getToken)
      return engineRef.current
    },
    [applySnapshot, update],
  )

  /** Prepara el dispositivo; si el navegador no admite el SDK, pasa a Connect. */
  const prepareEngine = useCallback(
    async (forUser: string): Promise<{ engine: PlaybackEngine; target: PlaybackTarget }> => {
      let engine = getEngine(forUser)
      try {
        return { engine, target: await engine.prepare() }
      } catch (error) {
        if (!(error instanceof EngineUnsupportedError)) throw error
        engine.dispose()
        engineRef.current = null
        modeRef.current = 'connect'
        engine = getEngine(forUser)
        return { engine, target: await engine.prepare() }
      }
    },
    [getEngine],
  )

  /**
   * Ejecuta una orden del motor; si falla (por ejemplo, la app de Spotify se durmió), avisa. Un 403
   * que no es "falta Premium" ("Restriction violated": la orden no aplica en ese momento) no se
   * muestra: se vuelve a leer el estado para que el MiniPlayer refleje lo que de verdad pasa.
   */
  const run = useCallback(
    (action: (engine: PlaybackEngine) => Promise<void>) => {
      const engine = engineRef.current
      if (!engine) return
      lastCommandRef.current = Date.now()
      action(engine).catch((error: unknown) => {
        if (error instanceof SpotifyError && error.status === 403 && !error.premiumRequired) {
          void engine.readState().then((snapshot) => snapshot && applySnapshot(snapshot))
          return
        }
        showError(error)
      })
    },
    [showError, applySnapshot],
  )

  const startPlayback = useCallback(
    (spotifyId: string, force: boolean) => {
      if (!userId) return
      requestedRef.current = spotifyId
      // Dentro del gesto del usuario: desbloquea el audio en navegadores estrictos.
      engineRef.current?.unlockAudio()
      update({ visible: true, loading: true, notice: null, pendingSwitch: null, ended: false, positionMs: 0 })
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
          const { engine, target } = await prepareEngine(userId)
          update({ mode: engine.mode, deviceName: target.deviceName, supportsVolume: target.supportsVolume })
          if (!force) {
            // Spotify solo deja sonar un dispositivo a la vez: si ya suena en otro, se pregunta.
            const current = await spotifyApi.currentPlayback(await spotifyAuthService.getAccessToken(userId)).catch(() => null)
            if (current?.is_playing && current.device.id !== target.deviceId) {
              update({ loading: false, pendingSwitch: { spotifyId, deviceName: current.device.name } })
              return
            }
          }
          await engine.play(spotifyId)
          lastPositionRef.current = 0
          activeRef.current = true
          if (engine.mode === 'connect') {
            // Connect no avisa: se marca como sonando y se lee el estado en cuanto la app empieza.
            update({ paused: false })
            await sleep(CONNECT_SETTLE_MS)
            const snapshot = await engine.readState()
            if (snapshot) applySnapshot(snapshot)
          }
        } catch (error) {
          showError(error)
        }
      })()
    },
    [userId, prepareEngine, update, applySnapshot, showError],
  )

  const play = useCallback((spotifyId: string) => startPlayback(spotifyId, false), [startPlayback])

  /** "Cambiar aquí": reproduce en este dispositivo aunque suene en otro. */
  const confirmSwitch = useCallback(() => {
    if (state.pendingSwitch) startPlayback(state.pendingSwitch.spotifyId, true)
  }, [state.pendingSwitch, startPlayback])

  /**
   * "Cancelar": la música sigue en el otro dispositivo y aquí el MiniPlayer queda en pausa con la
   * canción pedida (decisión del propietario, 2026-11-15). Si aquí aún no había sonado, los datos de
   * la canción se piden a Spotify (GET /v1/tracks/{id}).
   */
  const cancelSwitch = useCallback(() => {
    activeRef.current = false
    const pending = state.pendingSwitch
    setState((current) => ({ ...current, pendingSwitch: null, loading: false, paused: true, ended: false, visible: true }))
    if (!pending || !userId || state.track?.spotifyId === pending.spotifyId) return
    void (async () => {
      try {
        const token = await spotifyAuthService.getAccessToken(userId)
        const data = await spotifyApi.track(token, pending.spotifyId)
        lastPositionRef.current = 0
        setState((current) => ({
          ...current,
          positionMs: 0,
          durationMs: data.duration_ms,
          track: {
            spotifyId: data.id,
            title: data.name,
            artist: data.artists.map((artist) => artist.name).join(', '),
            imageUrl: data.album.images[0]?.url ?? null,
          },
        }))
      } catch {
        // Sin datos de la canción no hay nada que mostrar: se oculta como antes.
        setState((current) => (current.track ? current : { ...current, visible: false }))
      }
    })()
  }, [state.pendingSwitch, state.track, userId])

  const togglePlay = useCallback(() => {
    // La música está en otro dispositivo: se vuelve a pedir esta canción (pregunta antes de cambiar).
    if (!activeRef.current) {
      if (state.track) startPlayback(state.track.spotifyId, false)
      return
    }
    if (state.ended) {
      update({ ended: false, paused: false, positionMs: 0 })
      lastPositionRef.current = 0
      run(async (engine) => {
        await engine.seek(0)
        await engine.resume()
      })
      return
    }
    const resume = state.paused
    // Connect no avisa del cambio: se refleja al momento (el SDK lo confirma con su evento).
    update({ paused: !resume })
    run((engine) => (resume ? engine.resume() : engine.pause()))
  }, [state.ended, state.paused, state.track, startPlayback, update, run])

  /** "Atrás": la barra se vacía al instante y la canción vuelve a sonar desde 0. */
  const restart = useCallback(() => {
    if (!activeRef.current) {
      if (state.track) startPlayback(state.track.spotifyId, false)
      return
    }
    // Si ya sonaba, basta con volver a 0:00 ("reanudar" algo que suena da 403 en Spotify Connect).
    const wasStopped = state.paused || state.ended
    lastPositionRef.current = 0
    update({ ended: false, paused: false, positionMs: 0 })
    run(async (engine) => {
      await engine.seek(0)
      if (wasStopped) await engine.resume()
    })
  }, [state.track, state.paused, state.ended, startPlayback, update, run])

  /** Barra de tiempo: mueve la canción a `positionMs` (si había terminado, queda en pausa ahí). */
  const seek = useCallback(
    (positionMs: number) => {
      if (!activeRef.current) return
      const value = Math.max(0, Math.round(positionMs))
      lastPositionRef.current = value
      update({ ended: false, positionMs: value })
      run((engine) => engine.seek(value))
    },
    [update, run],
  )

  /** "Adelante": pausa y deja la barra llena (ended); la lectura del estado ya no la vacía. */
  const finish = useCallback(() => {
    if (!activeRef.current) return
    // En pausa no se vuelve a pausar (también daría 403 en Spotify Connect).
    if (!state.paused) run((engine) => engine.pause())
    setState((current) => ({ ...current, paused: true, ended: true, positionMs: current.durationMs }))
  }, [state.paused, run])

  const setVolume = useCallback(
    (volume: number) => {
      const value = Math.min(100, Math.max(0, Math.round(volume)))
      volumeRef.current = value
      update({ volume: value })
      run((engine) => engine.setVolume(value))
    },
    [update, run],
  )

  const close = useCallback(() => {
    if (activeRef.current) run((engine) => engine.pause())
    update({ visible: false, expanded: false, notice: null, pendingSwitch: null, loading: false })
  }, [update, run])

  const setExpanded = useCallback((expanded: boolean) => update({ expanded }), [update])

  // Connect con la app de Spotify dormida: al volver a Junkbox (tras "Abrir en Spotify"), la app ya
  // está despierta y se pide otra vez la canción, sin preguntar (2026-11-19).
  const pendingSpotifyId = state.notice?.kind === 'no-device' ? (state.notice.spotifyId ?? null) : null
  useEffect(() => {
    if (!pendingSpotifyId) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') startPlayback(pendingSpotifyId, true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [pendingSpotifyId, startPlayback])

  // Progreso: se lee el estado del motor (SDK: dos veces por segundo mientras suena; Connect: cada
  // 1 s sonando y cada 5 s en pausa, para ver también lo que se cambie desde la app de Spotify).
  useEffect(() => {
    if (!state.visible || state.mode === null) return
    const engine = engineRef.current
    const interval = engine?.pollInterval(state.paused) ?? null
    if (!engine || interval === null) return
    const timer = window.setInterval(() => {
      const startedAt = Date.now()
      void engine.readState().then((snapshot) => {
        if (!snapshot) return
        // Lectura anterior a una orden del usuario (o justo después): traería el estado viejo.
        if (startedAt < lastCommandRef.current + COMMAND_GRACE_MS) return
        if (engine.mode === 'sdk') {
          // El SDK avisa de las pausas con su evento: aquí solo se avanza la barra.
          lastPositionRef.current = snapshot.positionMs
          setState((current) => (current.ended ? current : { ...current, positionMs: snapshot.positionMs, durationMs: snapshot.durationMs }))
          return
        }
        applySnapshot(snapshot)
      })
    }, interval)
    return () => window.clearInterval(timer)
  }, [state.visible, state.paused, state.mode, applySnapshot])

  // Al cerrar sesión (AppLayout se desmonta) o cambiar de usuario, se suelta el motor.
  useEffect(
    () => () => {
      engineRef.current?.dispose()
      engineRef.current = null
      modeRef.current = null
      premiumRef.current = null
      lastPositionRef.current = 0
      activeRef.current = false
      volumeRef.current = INITIAL_PLAYER_STATE.volume
      // Reinicio del estado al cerrar sesión o cambiar de usuario (fuera de un setState síncrono del efecto).
      queueMicrotask(() => setState(INITIAL_PLAYER_STATE))
    },
    [userId],
  )

  const value = useMemo<PlayerContextValue>(
    () => ({ state, play, confirmSwitch, cancelSwitch, togglePlay, restart, seek, finish, setVolume, close, setExpanded }),
    [state, play, confirmSwitch, cancelSwitch, togglePlay, restart, seek, finish, setVolume, close, setExpanded],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
