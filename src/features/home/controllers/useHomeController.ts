import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { useLoad, type LoadState } from '../../catalog/controllers/useLoad'
import type { UserSuggestion } from '../../social/models/social.types'
import { socialService } from '../../social/services/socialService'
import { FEED_TAB_PARAM, feedTabFromParam, FOLLOWING_VALUE, type HomeFeedTab, type HomeItem } from '../models/home.types'
import { homeService } from '../services/homeService'
import { useHomeFeed, type FeedState } from './useHomeFeed'

/** "Hecho para tus oídos": 4 en escritorio (2×2, Figma); el carrusel de móvil muestra todas. */
const RECOMMENDATIONS = 8
/** "Conecta por lo que suena": Figma muestra un usuario. */
const SUGGESTIONS = 1

const loadRecommendations = (_key: string, signal: AbortSignal) => homeService.getRecommendations(RECOMMENDATIONS, signal)
const loadSuggestions = (_key: string, signal: AbortSignal) => socialService.getSuggestions(SUGGESTIONS, signal)

export interface HomeController {
  recommendations: LoadState<HomeItem[]>
  retryRecommendations: () => void
  suggestions: LoadState<UserSuggestion[]>
  tab: HomeFeedTab
  selectTab: (tab: HomeFeedTab) => void
  feed: FeedState
  loadMoreFeed: () => void
  retryFeed: () => void
}

/**
 * Controlador de Inicio: recomendaciones (GET /home), sugerencias de usuarios
 * (GET /users/suggestions) y el feed (GET /feed). La pestaña vive en la URL (`?feed=siguiendo`).
 * Un 401 sin renovación posible cierra la sesión.
 */
export function useHomeController(): HomeController {
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const tab = feedTabFromParam(params.get(FEED_TAB_PARAM))
  const [recommendations, retryRecommendations] = useLoad('home', loadRecommendations)
  const [suggestions] = useLoad('suggestions', loadSuggestions)
  const { feed, loadMore, retry } = useHomeFeed(tab)

  const selectTab = useCallback(
    // Se conserva `state` (marca de reinicio de HomePage): cambiar de pestaña no recarga Inicio.
    (next: HomeFeedTab) => setParams(next === 'following' ? { [FEED_TAB_PARAM]: FOLLOWING_VALUE } : {}, { state }),
    [setParams, state],
  )

  return { recommendations, retryRecommendations, suggestions, tab, selectTab, feed, loadMoreFeed: loadMore, retryFeed: retry }
}
