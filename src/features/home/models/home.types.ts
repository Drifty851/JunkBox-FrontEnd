import type { TrackSummary } from '../../music/models/catalog.types'
import type { FeedTab } from '../../social/models/social.types'

/**
 * Contrato de GET /home (backend commit 1c35740, HOME-01). Por ahora una sola sección
 * ("made_for_you") y solo canciones: cada elemento es `type` más los campos de TrackSummary.
 */
export interface HomeItem extends TrackSummary {
  type: 'track'
}

/** Canción de la que salen las recomendaciones (`strategy: "similar_to_last"`). */
export interface RecommendationSeed {
  id: number
  spotify_id: string
  track_name: string
  artist_name: string
  genre: string | null
}

export interface HomeSection {
  id: string
  title: string
  /** `similar_to_last`: parecidas a lo último que calificaste o reseñaste. `popular`: sin actividad. */
  strategy: 'similar_to_last' | 'popular'
  seed: RecommendationSeed | null
  items: HomeItem[]
}

/** GET /home?limit= → 200. `limit` de 1 a 50. */
export interface HomeResponse {
  sections: HomeSection[]
}

/** Ruta de "Ver todo" de "Hecho para tus oídos". */
export const RECOMMENDATIONS_PATH = '/recomendaciones'

/** Pestañas del feed (Figma · Tabs de Inicio): "Para ti (Popular)" y "Siguiendo". */
export type HomeFeedTab = FeedTab
export const FEED_TAB_PARAM = 'feed'
export const FOLLOWING_VALUE = 'siguiendo'
export const feedTabFromParam = (value: string | null): HomeFeedTab => (value === FOLLOWING_VALUE ? 'following' : 'popular')
