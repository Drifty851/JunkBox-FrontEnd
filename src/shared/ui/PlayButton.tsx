import playCircleIcon from '../../assets/icons/play-circle.svg'
import { MaskIcon } from './MaskIcon'

interface PlayButtonProps {
  /** Nombre accesible, p. ej. "Reproducir Medallones". */
  label: string
  /** Reproduce la canción (features/player · usePlayer().play). Sin `onPlay` queda `aria-disabled`. */
  onPlay?: () => void
}

/** play-circle de MusicRow (Figma, 28 px), pintado con el color de texto del tema. */
export function PlayButton({ label, onPlay }: PlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={onPlay ? undefined : 'true'}
      title={onPlay ? undefined : 'Reproducción no disponible'}
      onClick={onPlay}
      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg aria-disabled:cursor-default"
    >
      <MaskIcon src={playCircleIcon} size={28} className="bg-fg" />
    </button>
  )
}
