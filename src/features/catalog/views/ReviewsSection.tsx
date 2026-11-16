import { Link } from 'react-router'
import { ReviewCard } from '../../../shared/ui/ReviewCard'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatRelativeTime } from '../../../shared/utils/formatTime'
import { userProfilePath } from '../../profile/models/profile'
import { reviewPath } from '../../reviews/models/reviewDetail'
import type { Review, ReviewPage } from '../../reviews/models/review.types'
import type { LoadState } from '../controllers/useLoad'
import { SectionHeader } from './DetailParts'

interface MusicPreview {
  title: string
  subtitle: string
  imageUrl: string | null
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
            <ReviewCard
              key={review.id}
              review={{
                authorName: review.author.display_name?.trim() || review.author.username,
                authorUsername: review.author.username,
                authorAvatarUrl: review.author.avatar_url,
                authorFallbackAvatarUrl: defaultAvatarUrl(review.author.username),
                authorHref: userProfilePath(review.author.username),
                reviewHref: reviewPath(review.id),
                when: formatRelativeTime(review.created_at),
                musicTitle: music.title,
                musicSubtitle: music.subtitle,
                musicImageUrl: music.imageUrl,
                score: review.rating_score,
                content: review.content,
                likes: review.likes_count,
              }}
            />
          ),
        )}
    </section>
  )
}

/**
 * ArtistReviewCard (Figma · 14296:11995): borde, padding 20, separación 12.
 * "Nombre · @usuario · hace 1 día" (14/SemiBold), "★★★★★ · 5/5", texto (14, text/secondary-3)
 * y "N Me gusta · comentarios" (12, text/secondary-2).
 */
function ArtistReviewCard({ review }: { review: Review }) {
  const name = review.author.display_name?.trim() || review.author.username
  const score = review.rating_score
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
        {review.likes_count === 1 ? '1 Me gusta' : `${review.likes_count} Me gusta`} ·{' '}
        <Link
          to={reviewPath(review.id)}
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Comentarios
        </Link>
      </p>
    </article>
  )
}
