import { useInfiniteScroll } from '../../../shared/hooks/useInfiniteScroll'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { ProfileTabList, type TabItem } from '../../profile/views/ProfileTabs'
import { reviewedMusicFromSummary } from '../../reviews/services/reviewDetailService'
import { SocialReviewCard } from '../../social/views/SocialReviewCard'
import type { FeedState } from '../controllers/useHomeFeed'
import type { HomeFeedTab } from '../models/home.types'

const TABS: TabItem<HomeFeedTab>[] = [
  { id: 'popular', label: 'Para ti (Popular)' },
  { id: 'following', label: 'Siguiendo' },
]

const EMPTY: Record<HomeFeedTab, string> = {
  popular: 'Todavía no hay reseñas.',
  following: 'Aquí aparecerán las reseñas de las personas que sigues.',
}

const RETRY_CLASSES =
  'cursor-pointer text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

function Skeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} aria-hidden="true" className="h-56 w-full rounded-lg bg-surface-input-disabled motion-safe:animate-pulse" />
  ))
}

interface HomeFeedProps {
  tab: HomeFeedTab
  onSelectTab: (tab: HomeFeedTab) => void
  feed: FeedState
  onLoadMore: () => void
  onRetry: () => void
}

/**
 * Feed de Inicio (Figma · FeedTimeline: Tabs 14296:15957 + ReviewCard) con GET /feed (HOME-04):
 * "Para ti (Popular)" son las reseñas del día ordenadas por Me gusta y comentarios, y después las
 * de días anteriores; "Siguiendo", las de las personas que sigues, de la más nueva a la más
 * antigua. Scroll infinito (decisión del propietario, 2026-11-19): al acercarse al final se pide
 * la siguiente página.
 */
export function HomeFeed({ tab, onSelectTab, feed, onLoadMore, onRetry }: HomeFeedProps) {
  const canLoadMore = feed.status === 'ready' && feed.hasMore && !feed.loadingMore && feed.moreError === null
  const sentinelRef = useInfiniteScroll(onLoadMore, canLoadMore)

  return (
    <div className="flex w-full flex-col gap-4 md:gap-6">
      <ProfileTabList tabs={TABS} active={tab} onSelect={onSelectTab} label="Feed de reseñas" />
      <div
        id={`profile-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`profile-tab-${tab}`}
        aria-busy={feed.status === 'loading' || (feed.status === 'ready' && feed.loadingMore)}
        className="flex w-full flex-col gap-6"
      >
        {feed.status === 'loading' ? (
          <>
            <p className="sr-only">Cargando reseñas…</p>
            <Skeletons count={2} />
          </>
        ) : feed.status === 'error' ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert message={feed.message} />
            <button type="button" onClick={onRetry} className={RETRY_CLASSES}>
              Reintentar
            </button>
          </div>
        ) : feed.reviews.length === 0 ? (
          <p className="text-sm leading-[1.4] text-fg-muted">{EMPTY[tab]}</p>
        ) : (
          <>
            {feed.reviews.map((review) => (
              <SocialReviewCard key={review.id} review={review} music={reviewedMusicFromSummary(review.target)} />
            ))}
            {feed.loadingMore && (
              <>
                <p className="sr-only">Cargando más reseñas…</p>
                <Skeletons count={1} />
              </>
            )}
            {feed.moreError !== null && (
              <div className="flex flex-col items-start gap-2">
                <FormAlert message={feed.moreError} />
                <button type="button" onClick={onLoadMore} className={RETRY_CLASSES}>
                  Reintentar
                </button>
              </div>
            )}
            {feed.hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}
          </>
        )}
      </div>
    </div>
  )
}
