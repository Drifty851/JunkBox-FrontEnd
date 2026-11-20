import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { DetailError, DetailLayout, DetailSkeleton } from '../../catalog/views/DetailParts'
import { SocialReviewCard } from '../../social/views/SocialReviewCard'
import { useReviewDetailController } from '../controllers/useReviewDetailController'
import { publishedLabel } from '../models/reviewDetail'
import { CommentThread } from './CommentThread'

/**
 * Reseña Completa · Figma: móvil 14244:52342 / 14263:23679, escritorio 14244:52506 / 14263:23859.
 * Cabecera con flecha y "La reseña de …" (Heading/28 Bold), la ReviewCard completa, la línea
 * "Medallones · Hoke · Publicada hoy a las 9:31" y los comentarios (a la derecha desde 1280 px,
 * debajo en pantallas menores).
 * No se muestra el SnippetPlayer (fragmento de 30 s): la reseña no guarda qué fragmento es.
 */
export function ReviewDetailPage() {
  const navigate = useNavigate()
  const { user, state, retry, comments, commentsTotal } = useReviewDetailController()
  const data = state.status === 'ready' ? state.data : null
  const authorName = data ? data.review.author.display_name?.trim() || data.review.author.username : null

  useEffect(() => {
    if (!authorName) return
    const previous = document.title
    document.title = `La reseña de ${authorName} · Junkbox`
    return () => {
      document.title = previous
    }
  }, [authorName])

  const header = (title: string) => (
    <header className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Volver"
        onClick={() => navigate(-1)}
        className="flex shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <MaskIcon src={arrowLeftIcon} size={20} className="bg-fg" />
      </button>
      <h1 className="min-w-0 truncate text-[22px] leading-[1.4] font-bold text-fg md:text-[28px]">{title}</h1>
    </header>
  )

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <DetailLayout>
        {header('Reseña')}
        <DetailSkeleton />
      </DetailLayout>
    )
  }
  if (state.status === 'error') {
    return (
      <DetailLayout>
        {header('Reseña')}
        <DetailError message={state.message} notFound={state.notFound} what="esta reseña" onRetry={retry} />
      </DetailLayout>
    )
  }

  const { review, music } = state.data
  const published = publishedLabel(review.created_at)
  const caption = [music?.title, music?.artistName, published].filter(Boolean).join(' · ')

  return (
    <DetailLayout>
      {header(`La reseña de ${authorName}`)}
      <div className="flex w-full flex-col gap-6 xl:flex-row xl:items-start xl:gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SocialReviewCard full review={review} music={music} />
          {caption && (
            <p className="text-xs leading-[1.4] text-fg-placeholder">
              {music ? (
                <Link to={music.href} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">
                  {[music.title, music.artistName].filter(Boolean).join(' · ')}
                </Link>
              ) : null}
              {music && published ? ' · ' : null}
              {published}
            </p>
          )}
        </div>
        <CommentThread comments={comments} total={commentsTotal} user={user} />
      </div>
    </DetailLayout>
  )
}
