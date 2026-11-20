import { ReviewCard } from '../../../shared/ui/ReviewCard'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatRelativeTime } from '../../../shared/utils/formatTime'
import { useAuth } from '../../auth/controllers/authContext'
import { userProfilePath } from '../../profile/models/profile'
import type { Review } from '../../reviews/models/review.types'
import { reviewPath } from '../../reviews/models/reviewDetail'
import { useFollow, useLike } from '../controllers/socialContext'

/** Lo reseñado (cabecera de la tarjeta). */
export interface ReviewedMusicPreview {
  title: string
  subtitle: string
  imageUrl: string | null
  /** Ficha de lo reseñado; sin ella el título no es enlace. */
  href?: string
}

interface SocialReviewCardProps {
  review: Review
  /** null: lo reseñado ya no existe o no se pudo leer. */
  music: ReviewedMusicPreview | null
  /** Tarjeta de la Reseña Completa (portada grande; "comentarios" no enlaza a sí misma). */
  full?: boolean
}

/**
 * ReviewCard con Me gusta y Seguir reales (2026-11-19), para Inicio, Fichas y Reseña Completa.
 * En las reseñas propias no hay botón Seguir (el backend no deja seguirse a uno mismo).
 */
export function SocialReviewCard({ review, music, full = false }: SocialReviewCardProps) {
  const { user } = useAuth()
  const author = review.author
  const follow = useFollow(author.id, review.following_author)
  const like = useLike(review.id, review.liked_by_me, review.likes_count)
  const name = author.display_name?.trim() || author.username
  const own = user?.id === author.id

  return (
    <ReviewCard
      full={full}
      review={{
        authorName: name,
        authorUsername: author.username,
        authorAvatarUrl: author.avatar_url,
        authorFallbackAvatarUrl: defaultAvatarUrl(author.username),
        authorHref: userProfilePath(author.username),
        reviewHref: full ? undefined : reviewPath(review.id),
        when: formatRelativeTime(review.created_at),
        musicTitle: music?.title ?? 'Música no disponible',
        musicHref: music?.href,
        musicSubtitle: music?.subtitle ?? '',
        musicImageUrl: music?.imageUrl ?? null,
        score: review.rating_score,
        content: review.content,
        likes: like.count,
        comments: review.comments_count,
      }}
      follow={own ? undefined : { following: follow.following, pending: follow.pending, onToggle: follow.toggle }}
      like={{ liked: like.liked, count: like.count, pending: like.pending, onToggle: like.toggle }}
    />
  )
}
