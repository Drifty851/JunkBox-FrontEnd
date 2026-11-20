import { Link } from 'react-router'
import { cn } from '../../../shared/utils/cn'
import { formatRelativeTime } from '../../../shared/utils/formatTime'
import { userProfilePath } from '../../profile/models/profile'
import { reviewPath } from '../../reviews/models/reviewDetail'
import type { Review, ReviewPage } from '../../reviews/models/review.types'
import { useLike } from '../../social/controllers/socialContext'
import { SocialReviewCard } from '../../social/views/SocialReviewCard'
import type { LoadState } from '../controllers/useLoad'
import { SectionHeader } from './DetailParts'

interface MusicPreview {
  title: string
  subtitle: string
  imageUrl: string | null
  /** Ficha de lo reseñado (el título de cada ReviewCard lleva a ella). */
  href: string
}

interface ReviewsSectionProps {
  /** "Reseñas recientes", "Reseñas del álbum", "Lo que dice la comunidad". */
  title: string
  state: LoadState<ReviewPage>
  /** Elemento reseñado (MusicPreview de ReviewCard). */
  music: MusicPreview
  /** `artist` usa ArtistReviewCard (Figma · 14296:11995), más compacta. */
  variant?: 'card' | 'artist'
}

const reviewsLabel = (total: number) => (total === 1 ? '1 reseña' : `${total} reseñas`)

/** Sección de reseñas de una ficha (GET /reviews del objetivo, las más recientes). */
export function ReviewsSection({ title, state, music, variant = 'card' }: ReviewsSectionProps) {
  return (
    <section aria-label={title} className="flex w-full min-w-0 flex-col gap-3">
      <SectionHeader
        title={title}
        aside={state.status === 'ready' ? <p className="text-xs text-fg-placeholder">{reviewsLabel(state.data.total)}</p> : undefined}
      />
      {state.status === 'loading' && <p className="text-sm leading-[1.4] text-fg-muted">Cargando reseñas…</p>}
      {state.status === 'error' && <p className="text-sm leading-[1.4] text-fg-muted">No pudimos cargar las reseñas.</p>}
      {state.status === 'ready' && state.data.reviews.length === 0 && (
        <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay reseñas. Sé el primero en reseñar.</p>
      )}
      {state.status === 'ready' &&
        state.data.reviews.map((review) =>
          variant === 'artist' ? (
            <ArtistReviewCard key={review.id} review={review} />
          ) : (
            <SocialReviewCard key={review.id} review={review} music={music} />
          ),
        )}
    </section>
  )
}

/**
 * ArtistReviewCard (Figma · 14296:11995): borde, padding 20, separación 12.
 * "Nombre · @usuario · hace 1 día" (14/SemiBold), "★★★★★ · 5/5", texto (14, text/secondary-3)
 * y "N Me gusta · N comentarios" (12, text/secondary-2). "N Me gusta" se puede pulsar
 * (2026-11-19); dado, va en `accent` como en ReviewCard.
 */
function ArtistReviewCard({ review }: { review: Review }) {
  const name = review.author.display_name?.trim() || review.author.username
  const score = review.rating_score
  const like = useLike(review.id, review.liked_by_me, review.likes_count)
  const likes = like.count === 1 ? '1 Me gusta' : `${like.count} Me gusta`
  const comments = review.comments_count === 1 ? '1 comentario' : `${review.comments_count} comentarios`
  return (
    <article className="flex w-full flex-col gap-3 rounded-lg border border-line p-5 leading-[1.4]">
      <p className="truncate text-sm font-semibold text-fg">
        <Link
          to={userProfilePath(review.author.username)}
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {name} · @{review.author.username}
        </Link>{' '}
        · {formatRelativeTime(review.created_at)}
      </p>
      {score !== null && (
        <p className="text-sm font-semibold text-fg">
          <span aria-hidden="true">{'★'.repeat(Math.round(score))}</span> · {String(score).replace('.', ',')}/5
        </p>
      )}
      <p className="text-sm break-words whitespace-pre-line text-fg-soft">{review.content}</p>
      <p className="text-xs text-fg-placeholder">
        <button
          type="button"
          onClick={like.toggle}
          aria-pressed={like.liked}
          aria-disabled={like.pending || undefined}
          aria-label={`${like.liked ? 'Quitar Me gusta' : 'Me gusta'} (${likes})`}
          className={cn(
            'cursor-pointer rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            like.liked && 'text-accent',
            like.pending && 'cursor-progress',
          )}
        >
          {likes}
        </button>{' '}
        ·{' '}
        <Link
          to={reviewPath(review.id)}
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {comments}
        </Link>
      </p>
    </article>
  )
}
