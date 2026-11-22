import { useCallback, useMemo } from 'react'
import { cursorErrorMessage, useCursorList, type CursorPage } from '../../../shared/hooks/useCursorList'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import type { Review } from '../../reviews/models/review.types'
import { socialService } from '../../social/services/socialService'
import type { HomeFeedTab } from '../models/home.types'

export type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      reviews: Review[]
      hasMore: boolean
      /** Se está pidiendo la siguiente página. */
      loadingMore: boolean
      /** Falló la siguiente página: las reseñas ya cargadas se mantienen. */
      moreError: string | null
    }

export interface HomeFeedController {
  feed: FeedState
  /** Pide la siguiente página (scroll infinito o "Reintentar" tras un fallo). */
  loadMore: () => void
  /** Vuelve a pedir la primera página tras un error. */
  retry: () => void
}

const reviewId = (review: Review) => review.id

/**
 * Feed de Inicio (GET /feed, HOME-04) con paginación por cursor sobre `useCursorList`
 * (shared/hooks, 2026-11-19). Cambiar de pestaña o reintentar empieza de cero; en "Para ti" una
 * reseña puede cambiar de página al ganar Me gusta, así que no se repiten. Un 401 sin renovación
 * posible cierra la sesión.
 */
export function useHomeFeed(tab: HomeFeedTab): HomeFeedController {
  const { logout } = useAuth()
  const loadPage = useCallback(
    async (cursor: string | null, signal: AbortSignal): Promise<CursorPage<Review>> => {
      const page = await socialService.getFeedPage(tab, cursor, signal)
      return { items: page.reviews, nextCursor: page.next_cursor }
    },
    [tab],
  )
  const toMessage = useMemo(() => cursorErrorMessage(logout, toUserMessage), [logout])
  const { state, loadMore, retry } = useCursorList(tab, { loadPage, getId: reviewId, toMessage })

  const feed: FeedState = state.status === 'ready' ? { ...state, reviews: state.items } : state
  return { feed, loadMore, retry }
}
