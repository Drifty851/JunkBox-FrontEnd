import { Link } from 'react-router'
import chevronUpIcon from '../../../assets/icons/chevron-up-20.svg'
import xIcon from '../../../assets/icons/x-16.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { SETTINGS_PATH } from '../../settings/models/settings'
import { usePlayer } from '../controllers/playerContext'
import { formatPlaybackTime } from '../models/player'
import { FinishButton, ICON_BUTTON, PlayPauseButton, ProgressBar, RestartButton, VolumeControl } from './PlayerControls'
import { PlayerSheet } from './PlayerSheet'

function Artwork({ url, className }: { url: string | null; className: string }) {
  return (
    <span className={cn('block shrink-0 overflow-hidden rounded bg-surface-input-disabled', className)}>
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </span>
  )
}

function CloseButton() {
  const { close } = usePlayer()
  return (
    <button type="button" onClick={close} aria-label="Cerrar reproductor" className={cn(ICON_BUTTON, 'size-6')}>
      <MaskIcon src={xIcon} size={16} className="bg-fg" />
    </button>
  )
}

/**
 * MiniPlayer (Figma · MiniPlayer 14296:15106): escritorio MiniPlayer-03 (14296:14648, alto 76) y
 * móvil MiniPlayer-04 (14296:14924, alto 62). Va al pie de las pantallas con sesión, encima de la
 * BottomBar en móvil. Fuera de Figma (propuestas aprobadas el 2026-11-13): el control de volumen
 * junto al icono volume-2 en escritorio, el aviso sin Spotify Premium y la vista ampliada.
 */
export function MiniPlayer() {
  const { state, setExpanded } = usePlayer()
  if (!state.visible) return null

  if (state.notice) {
    return (
      <section aria-label="Reproductor" className="border-t border-line bg-surface-nav">
        <div role="status" className="flex min-h-[60px] items-center gap-3 px-4 py-2 md:min-h-[76px] md:px-8 xl:px-16">
          <p className="min-w-0 flex-1 text-[13px] leading-[1.4] text-fg">
            {state.notice.message}{' '}
            {state.notice.kind !== 'error' && (
              <Link to={SETTINGS_PATH} className="rounded font-semibold whitespace-nowrap text-link underline focus-visible:outline-2 focus-visible:outline-fg">
                Ir a Configuración
              </Link>
            )}
          </p>
          <CloseButton />
        </div>
      </section>
    )
  }

  const title = state.track?.title ?? 'Preparando el reproductor…'
  const artist = state.track?.artist ?? 'Spotify'
  const expandButton = (
    <button type="button" onClick={() => setExpanded(true)} aria-label="Ampliar reproductor" aria-haspopup="dialog" className={cn(ICON_BUTTON, 'size-6')}>
      <MaskIcon src={chevronUpIcon} size={20} className="bg-fg" />
    </button>
  )

  return (
    <>
      <section aria-label="Reproductor" aria-busy={state.loading || undefined} className="border-t border-line bg-surface-nav">
        {/* Móvil (MiniPlayer-04): artwork 36, título y artista, pausa, flecha y cerrar; progreso de 2 px abajo. */}
        <div className="md:hidden">
          <div className="flex h-[60px] items-center gap-3 px-4">
            <Artwork url={state.track?.imageUrl ?? null} className="size-9" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
              <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
              <p className="truncate text-[11px] text-fg-placeholder">{artist}</p>
            </div>
            <PlayPauseButton className="size-7" />
            {expandButton}
            <CloseButton />
          </div>
          <ProgressBar className="h-0.5 w-full" />
        </div>

        {/* Escritorio (MiniPlayer-03): alto 76, padding 64, separación 12. */}
        <div className="hidden h-[76px] items-center gap-3 md:flex md:px-8 xl:px-16">
          <Artwork url={state.track?.imageUrl ?? null} className="size-11" />
          <div className="flex w-40 min-w-0 flex-col gap-0.5 leading-[1.4] lg:w-[260px]">
            <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
            <p className="truncate text-[11px] text-fg-placeholder">{artist}</p>
          </div>
          <RestartButton className="size-6" />
          <PlayPauseButton className="size-7" />
          <FinishButton className="size-6" />
          <span className="text-[11px] leading-[1.4] text-fg-placeholder tabular-nums">{formatPlaybackTime(state.positionMs)}</span>
          <ProgressBar className="h-[3px] min-w-0 flex-1" />
          <span className="text-[11px] leading-[1.4] text-fg-placeholder tabular-nums">{formatPlaybackTime(state.durationMs)}</span>
          <VolumeControl sliderClassName="w-20 lg:w-24" />
          {expandButton}
          <CloseButton />
        </div>
      </section>
      {state.expanded && <PlayerSheet />}
    </>
  )
}
