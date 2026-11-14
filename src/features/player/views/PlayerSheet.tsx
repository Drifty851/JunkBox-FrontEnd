import { useEffect, useRef } from 'react'
import chevronUpIcon from '../../../assets/icons/chevron-up-20.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { usePlayer } from '../controllers/playerContext'
import { formatPlaybackTime } from '../models/player'
import { FinishButton, ICON_BUTTON, PlayPauseButton, ProgressBar, RestartButton, VolumeControl } from './PlayerControls'

/**
 * Vista ampliada del reproductor (flecha chevron-up del MiniPlayer). No está en Figma: propuesta
 * aprobada por el propietario (2026-11-13) para tener en móvil atrás, adelante y volumen, que el
 * MiniPlayer de Figma no muestra. Usa los mismos iconos y tokens. Pantalla completa en móvil y panel
 * centrado en escritorio; Escape o la flecha la cierran.
 */
export function PlayerSheet() {
  const { state, setExpanded } = usePlayer()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setExpanded])

  const track = state.track
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg md:items-center md:bg-black/40" onClick={() => setExpanded(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reproductor"
        onClick={(event) => event.stopPropagation()}
        className="flex size-full flex-col items-center gap-6 bg-bg px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] md:h-auto md:max-w-md md:rounded-lg md:border md:border-line md:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Reducir reproductor"
          className={cn(ICON_BUTTON, 'size-9 self-start rotate-180')}
        >
          <MaskIcon src={chevronUpIcon} size={20} className="bg-fg" />
        </button>

        <span className="block aspect-square w-full max-w-72 overflow-hidden rounded bg-surface-input-disabled">
          {track?.imageUrl && <img src={track.imageUrl} alt="" className="size-full object-cover" />}
        </span>

        <div className="flex w-full flex-col gap-1 text-center leading-[1.4]">
          <p className="truncate text-xl font-semibold text-fg">{track?.title ?? 'Preparando el reproductor…'}</p>
          <p className="truncate text-sm text-fg-soft">{track?.artist ?? 'Spotify'}</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <ProgressBar className="h-1 w-full rounded-full" />
          <div className="flex justify-between text-xs leading-[1.4] text-fg-placeholder tabular-nums">
            <span>{formatPlaybackTime(state.positionMs)}</span>
            <span>{formatPlaybackTime(state.durationMs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <RestartButton className="size-11" />
          <PlayPauseButton size={28} className="size-14 bg-surface-input-disabled" />
          <FinishButton className="size-11" />
        </div>

        <VolumeControl className="w-full max-w-72" sliderClassName="min-w-0 flex-1" />
      </div>
    </div>
  )
}
