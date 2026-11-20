import { Link } from 'react-router'
import chevronUpIcon from '../../../assets/icons/chevron-up-20.svg'
import xIcon from '../../../assets/icons/x-16.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { songPath, spotifyUrl } from '../../catalog/models/catalogPaths'
import { SETTINGS_PATH } from '../../settings/models/settings'
import { usePlayer } from '../controllers/playerContext'
import { SDK_DEVICE_NAME } from '../infrastructure/sdkEngine'
import { useOpenSongPage } from '../controllers/useOpenSongPage'
import { formatPlaybackTime } from '../models/player'
import { FinishButton, ICON_BUTTON, PlayPauseButton, ProgressBar, RestartButton, VolumeControl } from './PlayerControls'
import { PlayerSheet } from './PlayerSheet'

/** Botón pequeño de Figma (Variant=Button, alto 32) para los avisos con decisión. */
const SWITCH_BUTTON =
  'flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-sm leading-[1.4] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

function Artwork({ url, className }: { url: string | null; className: string }) {
  return (
    <span className={cn('block shrink-0 overflow-hidden rounded bg-surface-input-disabled', className)}>
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </span>
  )
}

/**
 * Carátula + título y artista de la canción que suena. Con canción, todo el bloque abre su ficha
 * (petición del propietario, 2026-11-15); la música sigue al navegar (PlayerProvider vive en App).
 */
function NowPlaying({ title, artist, artworkClass, className }: { title: string; artist: string; artworkClass: string; className: string }) {
  const { state } = usePlayer()
  const { open, opening } = useOpenSongPage()
  const track = state.track
  const content = (
    <>
      <Artwork url={track?.imageUrl ?? null} className={artworkClass} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
        <span className="truncate text-[13px] font-semibold text-fg group-hover:underline">{title}</span>
        <span className="truncate text-[11px] text-fg-placeholder">{artist}</span>
      </span>
    </>
  )
  if (!track?.spotifyId) return <div className={cn('flex min-w-0 items-center gap-3', className)}>{content}</div>
  return (
    <Link
      to={songPath(track.spotifyId)}
      onClick={(event) => open(event, track)}
      aria-label={`Abrir la ficha de ${track.title}`}
      aria-busy={opening || undefined}
      className={cn('group flex min-w-0 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg', opening && 'cursor-progress', className)}
    >
      {content}
    </Link>
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
  const { state, setExpanded, confirmSwitch, cancelSwitch } = usePlayer()
  if (!state.visible) return null

  if (state.pendingSwitch) {
    const { deviceName } = state.pendingSwitch
    const where = deviceName === SDK_DEVICE_NAME ? 'otra pestaña de Junkbox' : `«${deviceName}»`
    // Con Spotify Connect la música pasa a la app de Spotify de este teléfono o tableta.
    const here = state.mode === 'connect' ? 'este dispositivo' : 'esta pestaña'
    return (
      <section aria-label="Reproductor" className="border-t border-line bg-surface-nav">
        <div role="alertdialog" aria-labelledby="player-switch-text" className="flex min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:min-h-[76px] md:flex-nowrap md:px-8 xl:px-16">
          <p id="player-switch-text" className="min-w-0 flex-1 basis-full text-[13px] leading-[1.4] text-fg md:basis-auto">
            Ya tienes música sonando en {where}. ¿Quieres cambiarla a {here}?
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button type="button" onClick={cancelSwitch} className={SWITCH_BUTTON + ' border border-line bg-surface-quickplay text-fg'}>
              Cancelar
            </button>
            <button type="button" onClick={confirmSwitch} autoFocus className={SWITCH_BUTTON + ' border border-action bg-action text-on-action'}>
              Cambiar aquí
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (state.notice) {
    return (
      <section aria-label="Reproductor" className="border-t border-line bg-surface-nav">
        <div role="status" className="flex min-h-[60px] items-center gap-3 px-4 py-2 md:min-h-[76px] md:px-8 xl:px-16">
          <p className="min-w-0 flex-1 text-[13px] leading-[1.4] text-fg">
            {state.notice.message}{' '}
            {(state.notice.kind === 'unlinked' || state.notice.kind === 'not-premium') && (
              <Link to={SETTINGS_PATH} className="rounded font-semibold whitespace-nowrap text-link underline focus-visible:outline-2 focus-visible:outline-fg">
                Ir a Configuración
              </Link>
            )}
          </p>
          {/*
            Spotify Connect con la app dormida (2026-11-19): abre la canción en la app de Spotify (en
            otra pestaña, para que Junkbox siga abierto); al volver, PlayerProvider la pide de nuevo.
          */}
          {state.notice.kind === 'no-device' && state.notice.spotifyId && (
            <a
              href={spotifyUrl('song', state.notice.spotifyId)}
              target="_blank"
              rel="noopener noreferrer"
              className={SWITCH_BUTTON + ' shrink-0 border border-action bg-action text-on-action'}
            >
              Abrir en Spotify
            </a>
          )}
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
            <NowPlaying title={title} artist={artist} artworkClass="size-9" className="flex-1" />
            <PlayPauseButton className="size-7" />
            {expandButton}
            <CloseButton />
          </div>
          <ProgressBar thickness={2} className="w-full" />
        </div>

        {/* Escritorio (MiniPlayer-03): alto 76, padding 64, separación 12. */}
        <div className="hidden h-[76px] items-center gap-3 md:flex md:px-8 xl:px-16">
          {/* Artwork 44 + "Now playing" de 260 (Figma). */}
          <NowPlaying title={title} artist={artist} artworkClass="size-11" className="w-[216px] shrink-0 lg:w-[316px]" />
          <RestartButton className="size-6" />
          <PlayPauseButton className="size-7" />
          <FinishButton className="size-6" />
          <span className="text-[11px] leading-[1.4] text-fg-placeholder tabular-nums">{formatPlaybackTime(state.positionMs)}</span>
          <ProgressBar thickness={3} className="min-w-0 flex-1" />
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
