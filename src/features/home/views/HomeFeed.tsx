import { FormAlert } from '../../../shared/ui/FormAlert'
import { ReviewCard } from '../../../shared/ui/ReviewCard'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatRelativeTime } from '../../../shared/utils/formatTime'
import { userProfilePath } from '../../profile/models/profile'
import { PendingList, ProfileTabList, type TabItem } from '../../profile/views/ProfileTabs'
import { reviewPath } from '../../reviews/models/reviewDetail'
import type { FeedState } from '../controllers/useHomeController'
import { targetPath, type HomeFeedTab } from '../models/home.types'

const TABS: TabItem<HomeFeedTab>[] = [
  { id: 'popular', label: 'Para ti (Popular)' },
  { id: 'following', label: 'Siguiendo' },
]

/**
 * Feed de Inicio (Figma · FeedTimeline: Tabs 14296:15957 + ReviewCard). "Para ti (Popular)" muestra
 * reseñas reales de música elegida al azar en cada carga, ordenadas por popularidad (2026-11-15,
 * hasta HOME-04). "Siguiendo" espera a FOL-01 y HOME-04.
 */
export function HomeFeed({ tab, onSelectTab, feed, onRetry }: { tab: HomeFeedTab; onSelectTab: (tab: HomeFeedTab) => void; feed: FeedState; onRetry: () => void }) {
  return (
    <div className="flex w-full flex-col gap-4 md:gap-6">
      <ProfileTabList tabs={TABS} active={tab} onSelect={onSelectTab} label="Feed de reseñas" />
      <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} aria-busy={tab === 'popular' && feed.status === 'loading'} className="flex w-full flex-col gap-6">
        {tab === 'following' ? (
          <PendingList>Aquí aparecerán las reseñas de las personas que sigues.</PendingList>
        ) : feed.status === 'loading' ? (
          <>
            <p className="sr-only">Cargando reseñas…</p>
            {[0, 1].map((index) => (
              <div key={index} aria-hidden="true" className="h-56 w-full rounded-lg bg-surface-input-disabled motion-safe:animate-pulse" />
            ))}
          </>
        ) : feed.status === 'error' ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert message={feed.message} />
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              Reintentar
            </button>
          </div>
        ) : feed.reviews.length === 0 ? (
          <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay reseñas.</p>
        ) : (
          feed.reviews.map(({ review, target }) => {
            const name = review.author.display_name?.trim() || review.author.username
            return (
              <ReviewCard
                key={review.id}
                review={{
                  authorName: name,
                  authorUsername: review.author.username,
                  authorAvatarUrl: review.author.avatar_url,
                  authorFallbackAvatarUrl: defaultAvatarUrl(review.author.username),
                  authorHref: userProfilePath(review.author.username),
                  reviewHref: reviewPath(review.id),
                  when: formatRelativeTime(review.created_at),
                  musicTitle: target.title,
                  musicHref: targetPath(target),
                  musicSubtitle: target.subtitle,
                  musicImageUrl: target.imageUrl,
                  score: review.rating_score,
                  content: review.content,
                  likes: review.likes_count,
                }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
