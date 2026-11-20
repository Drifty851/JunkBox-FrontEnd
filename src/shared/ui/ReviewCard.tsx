import likeIcon from '../../assets/icons/like.svg'
import messageSquareIcon from '../../assets/icons/message-square.svg'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '../utils/cn'
import { Avatar } from './Avatar'
import { FollowButton, type FollowControl } from './FollowButton'
import { MaskIcon } from './MaskIcon'
import { StarRating } from './StarRating'

export interface ReviewCardData {
  authorName: string
  authorUsername: string
  authorAvatarUrl: string | null
  authorFallbackAvatarUrl: string | null
  /** Perfil del autor (`/usuario/:username`); sin él, el autor no es enlace. */
  authorHref?: string
  /** Reseña Completa (`/resena/:id`): "Comentarios" lleva a ella. */
  reviewHref?: string
  /** "hace 2 h". */
  when: string
  musicTitle: string
  musicSubtitle: string
  musicImageUrl: string | null
  /** Ficha de lo reseñado: el título lleva a ella (2026-11-15). */
  musicHref?: string
  /** Voto del autor; null si no calificó. */
  score: number | null
  content: string
  likes: number
  /** Comentarios de la reseña (`comments_count`). */
  comments: number
}

/** Me gusta de la tarjeta (los aporta el módulo social con `useLike`). */
export interface LikeControl {
  liked: boolean
  count: number
  pending: boolean
  onToggle: () => void
}

const likesLabel = (count: number) => (count === 1 ? '1 Me gusta' : `${count} Me gusta`)
const commentsLabel = (count: number) => (count === 1 ? '1 comentario' : `${count} comentarios`)

/**
 * ReviewCard (Figma · 14296:11962). Escritorio (ReviewCard-21): tarjeta con borde, padding 20,
 * fondo surface/default-5 y título 22. Móvil (ReviewCard-22): sin borde ni padding, título 18.
 * Acciones (decisión del propietario, 2026-11-15): solo Me gusta y Comentarios; Guardar y "más
 * opciones" se quitaron. "N comentarios" (Figma) abre la Reseña Completa (`reviewHref`).
 * Interacciones (2026-11-19): `follow` pinta Seguir / Siguiendo (sin él no hay botón: reseña propia)
 * y `like` hace pulsable el Me gusta; dado, el corazón y el contador van en `accent` (Figma no tiene
 * esa variante; decisión del propietario).
 * Con `authorHref`, el avatar y el nombre abren el perfil del autor (2026-11-15).
 * `full` es la tarjeta de la Reseña Completa (ReviewCard-17): portada de 104 en escritorio.
 */
export function ReviewCard({
  review,
  className,
  full = false,
  follow,
  like,
}: {
  review: ReviewCardData
  className?: string
  full?: boolean
  follow?: FollowControl
  like?: LikeControl
}) {
  return (
    <article
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg md:border md:border-line md:bg-surface-quickplay md:p-5',
        className,
      )}
    >
      <header className="flex w-full items-center gap-2">
        <AuthorLink href={review.authorHref} label={`Ver el perfil de ${review.authorName}`}>
          <Avatar
            src={review.authorAvatarUrl}
            fallbackSrc={review.authorFallbackAvatarUrl}
            alt=""
            className="size-8"
          />
          <span className="flex min-w-0 flex-1 flex-col leading-[1.4]">
            <span className="truncate text-sm font-semibold text-fg group-hover:underline">{review.authorName}</span>
            <span className="truncate text-xs text-fg-placeholder">
              @{review.authorUsername} · {review.when}
            </span>
          </span>
        </AuthorLink>
        {follow && <FollowButton name={review.authorName} control={follow} />}
      </header>

      <div className="flex w-full items-center gap-3">
        <span className={cn('block size-12 shrink-0 overflow-hidden rounded bg-surface-input-disabled', full && 'md:size-[104px]')}>
          {review.musicImageUrl !== null && <img src={review.musicImageUrl} alt="" className="size-full object-cover" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
          <p className="truncate text-lg font-bold text-fg md:text-[22px]">
            {review.musicHref ? (
              <Link
                to={review.musicHref}
                className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {review.musicTitle}
              </Link>
            ) : (
              review.musicTitle
            )}
          </p>
          <p className="truncate text-sm text-fg-soft">{review.musicSubtitle}</p>
          {review.score !== null && <StarRating value={review.score} />}
        </div>
      </div>

      <p className="w-full text-sm leading-[1.4] break-words whitespace-pre-line text-fg">{review.content}</p>

      <footer className="flex w-full items-center gap-5 text-xs leading-[1.4] text-fg">
        {like ? (
          <button
            type="button"
            onClick={like.onToggle}
            aria-pressed={like.liked}
            aria-disabled={like.pending || undefined}
            aria-label={`${like.liked ? 'Quitar Me gusta' : 'Me gusta'} (${likesLabel(like.count)})`}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
              like.liked && 'text-accent',
              like.pending && 'cursor-progress',
            )}
          >
            <MaskIcon src={likeIcon} size={18} className={like.liked ? 'bg-accent' : 'bg-fg'} />
            {likesLabel(like.count)}
          </button>
        ) : (
          <span className="flex items-center gap-1.5">
            <MaskIcon src={likeIcon} size={18} className="bg-fg" />
            {likesLabel(review.likes)}
          </span>
        )}
        {review.reviewHref ? (
          <Link
            to={review.reviewHref}
            className="flex items-center gap-1.5 rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MaskIcon src={messageSquareIcon} size={18} className="bg-fg" />
            {commentsLabel(review.comments)}
          </Link>
        ) : (
          <span className="flex items-center gap-1.5">
            <MaskIcon src={messageSquareIcon} size={18} className="bg-fg" />
            {commentsLabel(review.comments)}
          </span>
        )}
      </footer>
    </article>
  )
}

/** Avatar y nombre del autor: enlace a su perfil cuando hay `href`. */
function AuthorLink({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  const className = 'group flex min-w-0 flex-1 items-center gap-2'
  if (!href) return <div className={className}>{children}</div>
  return (
    <Link to={href} aria-label={label} className={cn(className, 'rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg')}>
      {children}
    </Link>
  )
}
