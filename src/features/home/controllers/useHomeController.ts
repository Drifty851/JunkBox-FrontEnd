import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import { FEED_TAB_PARAM, feedTabFromParam, FOLLOWING_VALUE, type DemoTarget, type FeedReview, type HomeFeedTab } from '../models/home.types'
import { homeService } from '../services/homeService'

/** "Hecho para tus oídos": 4 en escritorio (2×2, Figma); el carrusel de móvil muestra todas. */
const RECOMMENDATIONS = 8

export type FeedState =
  | { status: 'loading' }
  | { status: 'ready'; reviews: FeedReview[] }
  | { status: 'error'; message: string }

type Outcome = { attempt: number; reviews: FeedReview[] } | { attempt: number; message: string }

export interface HomeController {
  recommendations: DemoTarget[]
  tab: HomeFeedTab
  selectTab: (tab: HomeFeedTab) => void
  feed: FeedState
  retryFeed: () => void
}

/**
 * Controlador de Inicio. Las recomendaciones se eligen al azar al entrar (síncrono, de la lista
 * de prueba); el feed pide las reseñas reales. La pestaña vive en la URL (`?feed=siguiendo`).
 * Un 401 sin renovación posible cierra la sesión.
 */
export function useHomeController(): HomeController {
  const { logout } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = feedTabFromParam(params.get(FEED_TAB_PARAM))
  const [recommendations] = useState(() => homeService.pickRecommendations(RECOMMENDATIONS))
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    homeService
      .loadFeed(controller.signal)
      .then((reviews) => setOutcome({ attempt, reviews }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          void logout()
          return
        }
        setOutcome({ attempt, message: toUserMessage(error) })
      })
    return () => controller.abort()
  }, [attempt, logout])

  let feed: FeedState = { status: 'loading' }
  if (outcome?.attempt === attempt) feed = 'reviews' in outcome ? { status: 'ready', reviews: outcome.reviews } : { status: 'error', message: outcome.message }

  const selectTab = useCallback(
    (next: HomeFeedTab) => setParams(next === 'following' ? { [FEED_TAB_PARAM]: FOLLOWING_VALUE } : {}),
    [setParams],
  )
  const retryFeed = useCallback(() => setAttempt((value) => value + 1), [])

  return { recommendations, tab, selectTab, feed, retryFeed }
}
