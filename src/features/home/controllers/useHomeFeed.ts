import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
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

interface FeedData {
  key: string
  reviews: Review[]
  nextCursor: string | null
  loadingMore: boolean
  moreError: string | null
}

type Outcome = FeedData | { key: string; message: string }

/** Añade la página nueva sin repetir reseñas: en "Para ti" una reseña puede cambiar de página al ganar Me gusta. */
function appendUnique(current: Review[], next: Review[]): Review[] {
  const seen = new Set(current.map((review) => review.id))
  return [...current, ...next.filter((review) => !seen.has(review.id))]
}

export interface HomeFeedController {
  feed: FeedState
  /** Pide la siguiente página (scroll infinito o "Reintentar" tras un fallo). */
  loadMore: () => void
  /** Vuelve a pedir la primera página tras un error. */
  retry: () => void
}

/**
 * Feed de Inicio (GET /feed, HOME-04) con paginación por cursor. Cambiar de pestaña o reintentar
 * empieza de cero; el estado se deriva de la clave (pestaña + intento), sin setState síncrono en
 * el efecto. Un 401 sin renovación posible cierra la sesión.
 */
export function useHomeFeed(tab: HomeFeedTab): HomeFeedController {
  const { logout } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const key = `${tab}:${attempt}`
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const current = useRef<Outcome | null>(null)
  const moreController = useRef<AbortController | null>(null)

  useEffect(() => {
    current.current = outcome
  }, [outcome])

  const handleError = useCallback(
    (error: unknown): string | null => {
      if (error instanceof ApiError && error.status === 401) {
        void logout()
        return null
      }
      return toUserMessage(error)
    },
    [logout],
  )

  useEffect(() => {
    const controller = new AbortController()
    socialService
      .getFeedPage(tab, null, controller.signal)
      .then((page) => setOutcome({ key, reviews: page.reviews, nextCursor: page.next_cursor, loadingMore: false, moreError: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = handleError(error)
        if (message !== null) setOutcome({ key, message })
      })
    return () => {
      controller.abort()
      moreController.current?.abort()
    }
  }, [tab, key, handleError])

  const loadMore = useCallback(() => {
    const data = current.current
    if (!data || data.key !== key || !('reviews' in data) || !data.nextCursor || data.loadingMore) return
    const cursor = data.nextCursor
    const controller = new AbortController()
    moreController.current = controller
    const loading: FeedData = { ...data, loadingMore: true, moreError: null }
    current.current = loading
    setOutcome(loading)
    socialService
      .getFeedPage(tab, cursor, controller.signal)
      .then((page) =>
        setOutcome((previous) =>
          previous && previous.key === key && 'reviews' in previous
            ? { ...previous, reviews: appendUnique(previous.reviews, page.reviews), nextCursor: page.next_cursor, loadingMore: false }
            : previous,
        ),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = handleError(error)
        if (message === null) return
        setOutcome((previous) =>
          previous && previous.key === key && 'reviews' in previous ? { ...previous, loadingMore: false, moreError: message } : previous,
        )
      })
  }, [tab, key, handleError])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  let feed: FeedState = { status: 'loading' }
  if (outcome?.key === key) {
    feed =
      'reviews' in outcome
        ? { status: 'ready', reviews: outcome.reviews, hasMore: outcome.nextCursor !== null, loadingMore: outcome.loadingMore, moreError: outcome.moreError }
        : { status: 'error', message: outcome.message }
  }

  return { feed, loadMore, retry }
}
