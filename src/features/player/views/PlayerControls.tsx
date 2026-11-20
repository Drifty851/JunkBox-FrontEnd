import { useRef, useState } from 'react'
import pauseIcon from '../../../assets/icons/pause-24.svg'
import play14Icon from '../../../assets/icons/play-14.svg'
import skipBackIcon from '../../../assets/icons/skip-back-20.svg'
import skipForwardIcon from '../../../assets/icons/skip-forward-20.svg'
import volumeIcon from '../../../assets/icons/volume-2-20.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { formatPlaybackTime } from '../models/player'
import { usePlayer } from '../controllers/playerContext'

export const ICON_BUTTON =
  'flex shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-default disabled:opacity-40'

/**
 * Pausa (Figma · pause 24) o reproducir. Figma solo dibuja el estado reproduciendo; en pausa se usa
 * el "play" de QuickPlay a 24 px (decisión del propietario, 2026-11-13).
 */
export function PlayPauseButton({ size = 24, className }: { size?: number; className?: string }) {
  const { state, togglePlay } = usePlayer()
  const playing = !state.paused && !state.ended
  return (
    <button
      type="button"
      onClick={togglePlay}
      disabled={state.loading || state.track === null}
      aria-label={playing ? 'Pausar' : 'Reproducir'}
      className={cn(ICON_BUTTON, className)}
    >
      <MaskIcon src={playing ? pauseIcon : play14Icon} size={size} className="bg-fg" />
    </button>
  )
}

/** skip-back (Figma): reinicia la canción (regla del propietario). */
export function RestartButton({ className }: { className?: string }) {
  const { state, restart } = usePlayer()
  return (
    <button type="button" onClick={restart} disabled={state.track === null} aria-label="Reiniciar canción" className={cn(ICON_BUTTON, className)}>
      <MaskIcon src={skipBackIcon} size={20} className="bg-fg" />
    </button>
  )
}

/** skip-forward (Figma): termina la canción (regla del propietario). */
export function FinishButton({ className }: { className?: string }) {
  const { state, finish } = usePlayer()
  return (
    <button type="button" onClick={finish} disabled={state.track === null || state.ended} aria-label="Terminar canción" className={cn(ICON_BUTTON, className)}>
      <MaskIcon src={skipForwardIcon} size={20} className="bg-fg" />
    </button>
  )
}

/**
 * Barra de tiempo (Figma · Track progress / Playback progress), arrastrable (petición del
 * propietario, 2026-11-13). Conserva el grosor de Figma (`thickness`: 2 móvil, 3 escritorio, 4 vista
 * ampliada) con el avance en el color de acción (negro en claro, #D3533C en oscuro) sobre `line`,
 * pero el área que se puede pulsar mide 12 px. Mientras se arrastra muestra la posición elegida y la
 * aplica al soltar; con el teclado, flechas de ±5 s.
 */
export function ProgressBar({ thickness, className }: { thickness: number; className?: string }) {
  const { state, seek } = usePlayer()
  const [dragMs, setDragMs] = useState<number | null>(null)
  const draggingRef = useRef(false)
  const duration = state.durationMs
  const value = dragMs ?? Math.min(state.positionMs, duration)
  const percent = duration > 0 ? (value / duration) * 100 : 0

  function commit() {
    if (dragMs !== null) seek(dragMs)
    draggingRef.current = false
    setDragMs(null)
  }

  return (
    <div className={cn('relative', className)} style={{ height: thickness }}>
      <input
        type="range"
        min={0}
        max={Math.max(duration, 1)}
        step={5000}
        value={value}
        disabled={state.track === null || duration === 0}
        aria-label="Posición de la canción"
        aria-valuetext={`${formatPlaybackTime(value)} de ${formatPlaybackTime(duration)}`}
        onPointerDown={() => {
          draggingRef.current = true
        }}
        onChange={(event) => {
          const next = Number(event.target.value)
          // Con el ratón o el dedo se aplica al soltar; con el teclado, en el momento.
          if (draggingRef.current) setDragMs(next)
          else seek(next)
        }}
        onPointerUp={commit}
        onPointerCancel={commit}
        onBlur={() => dragMs !== null && commit()}
        className="absolute inset-x-0 top-1/2 h-3 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent bg-center bg-no-repeat focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-default [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-action [&::-moz-range-thumb]:opacity-0 hover:[&::-moz-range-thumb]:opacity-100 focus-visible:[&::-moz-range-thumb]:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-action [&::-webkit-slider-thumb]:opacity-0 hover:[&::-webkit-slider-thumb]:opacity-100 focus-visible:[&::-webkit-slider-thumb]:opacity-100"
        style={{
          backgroundImage: `linear-gradient(to right, var(--color-action) ${percent}%, var(--color-line) ${percent}%)`,
          backgroundSize: `100% ${thickness}px`,
        }}
      />
    </div>
  )
}

/**
 * Icono volume-2 (Figma) con el control de 0 a 100 (empieza en 50; regla del propietario). No se
 * muestra si el dispositivo no deja cambiarlo (Spotify Connect en iPhone y iPad).
 */
export function VolumeControl({ className, sliderClassName }: { className?: string; sliderClassName?: string }) {
  const { state, setVolume } = usePlayer()
  if (!state.supportsVolume) return null
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <MaskIcon src={volumeIcon} size={20} className="bg-fg" />
      <span className="sr-only">Volumen</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={state.volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-valuetext={`${state.volume} %`}
        className={cn('h-1 cursor-pointer accent-fg', sliderClassName)}
      />
    </label>
  )
}
