import bookmarkIcon from '../../assets/icons/bookmark.svg'
import likeIcon from '../../assets/icons/like.svg'
import messageSquareIcon from '../../assets/icons/message-square.svg'
import moreHorizontalIcon from '../../assets/icons/more-horizontal.svg'
import { cn } from '../utils/cn'
import { Avatar } from './Avatar'
import { MaskIcon } from './MaskIcon'
import { StarRating } from './StarRating'

export interface ReviewCardData {
  authorName: string
  authorUsername: string
  authorAvatarUrl: string | null
  authorFallbackAvatarUrl: string | null
  /** "hace 2 h". */
  when: string
  musicTitle: string
  musicSubtitle: string
  musicImageUrl: string | null
  /** Voto del autor; null si no calificó. */
  score: number | null
  content: string
  likes: number
}

const PENDING = 'Disponible cuando el backend lo permita'

/**
 * ReviewCard (Figma · 14296:11962). Escritorio (ReviewCard-21): tarjeta con borde, padding 20,
 * fondo surface/default-5 y título 22. Móvil (ReviewCard-22): sin borde ni padding, título 18.
 * Seguir, más opciones, Me gusta, comentarios y guardar no tienen backend (REV-01): se muestran
 * con el estilo de Figma, sin acción y con `aria-disabled`.
 */
export function ReviewCard({ review, className }: { review: ReviewCardData; className?: string }) {
  return (
    <article
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg md:border md:border-line md:bg-surface-quickplay md:p-5',
        className,
      )}
    >
      <header className="flex w-full items-center gap-2">
        <Avatar
          src={review.authorAvatarUrl}
          fallbackSrc={review.authorFallbackAvatarUrl}
          alt=""
          className="size-8"
        />
        <div className="flex min-w-0 flex-1 flex-col leading-[1.4]">
          <p className="truncate text-sm font-semibold text-fg">{review.authorName}</p>
          <p className="truncate text-xs text-fg-placeholder">
            @{review.authorUsername} · {review.when}
          </p>
        </div>
        <button
          type="button"
          aria-disabled="true"
          title={PENDING}
          className="flex h-8 shrink-0 cursor-default items-center rounded-lg border border-line bg-surface-quickplay px-3 text-sm leading-[1.4] font-medium text-fg"
        >
          Seguir
        </button>
      </header>

      <div className="flex w-full items-center gap-3">
        <span className="block size-12 shrink-0 overflow-hidden rounded bg-surface-input-disabled">
          {review.musicImageUrl !== null && <img src={review.musicImageUrl} alt="" className="size-full object-cover" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
          <p className="truncate text-lg font-bold text-fg md:text-[22px]">{review.musicTitle}</p>
          <p className="truncate text-sm text-fg-soft">{review.musicSubtitle}</p>
          {review.score !== null && <StarRating value={review.score} />}
        </div>
        <span aria-disabled="true" title={PENDING} className="flex shrink-0">
          <MaskIcon src={moreHorizontalIcon} size={20} className="bg-fg" />
        </span>
      </div>

      <p className="w-full text-sm leading-[1.4] break-words whitespace-pre-line text-fg">{review.content}</p>

      <footer className="flex w-full items-center gap-5 text-xs leading-[1.4] text-fg">
        <span aria-disabled="true" title={PENDING} className="flex items-center gap-1.5">
          <MaskIcon src={likeIcon} size={18} className="bg-fg" />
          {review.likes === 1 ? '1 Me gusta' : `${review.likes} Me gusta`}
        </span>
        <span aria-disabled="true" title={PENDING} className="flex items-center gap-1.5">
          <MaskIcon src={messageSquareIcon} size={18} className="bg-fg" />
          Comentarios
        </span>
        <span aria-disabled="true" title={PENDING} className="flex">
          <MaskIcon src={bookmarkIcon} size={18} className="bg-fg" />
        </span>
      </footer>
    </article>
  )
}
