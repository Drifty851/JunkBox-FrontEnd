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

/** Barra de progreso (Figma · Track progress: control/indicator-2 con el avance en control/indicator-3). */
export function ProgressBar({ className }: { className?: string }) {
  const { state } = usePlayer()
  const percent = state.durationMs > 0 ? Math.min(100, (state.positionMs / state.durationMs) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label="Progreso de la canción"
      aria-valuemin={0}
      aria-valuemax={Math.round(state.durationMs / 1000)}
      aria-valuenow={Math.round(state.positionMs / 1000)}
      aria-valuetext={`${formatPlaybackTime(state.positionMs)} de ${formatPlaybackTime(state.durationMs)}`}
      className={cn('overflow-hidden bg-line', className)}
    >
      <div className="h-full bg-fg" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** Icono volume-2 (Figma) con el control de 0 a 100 (empieza en 50; regla del propietario). */
export function VolumeControl({ className, sliderClassName }: { className?: string; sliderClassName?: string }) {
  const { state, setVolume } = usePlayer()
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
