import { albumPath, artistPath, songPath } from '../../catalog/models/catalogPaths'
import type { Review } from '../../reviews/models/review.types'

/**
 * Objetivo de la lista de prueba de Inicio (`data/demoPool.ts`): canción, álbum o artista del
 * catálogo, con los datos que tenía al generarse. Decisión del propietario (2026-11-15): mientras
 * no haya recomendaciones ni feed en el backend (HOME-01, HOME-04), Inicio elige al azar de esta
 * lista en cada carga.
 */
export interface DemoTarget {
  type: 'song' | 'album' | 'artist'
  /** Canción: ID de Spotify. Álbum y artista: UUID local. Es el id que aceptan /music/* y /reviews. */
  id: string
  title: string
  /** "Hoke" (canción), "Hoke · Álbum · 2022" (álbum) o "Artista". */
  subtitle: string
  imageUrl: string | null
  /** Tiene reseñas de los usuarios de prueba: entra en el feed. */
  reviewed: boolean
}

/** Ruta de "Ver todo" de "Hecho para tus oídos". */
export const RECOMMENDATIONS_PATH = '/recomendaciones'

/** Ficha de cada objetivo. */
export function targetPath(target: DemoTarget): string {
  if (target.type === 'song') return songPath(target.id)
  return target.type === 'album' ? albumPath(target.id) : artistPath(target.id)
}

export const KIND_LABEL: Record<DemoTarget['type'], string> = { song: 'Canción', album: 'Álbum', artist: 'Artista' }

/** Pestañas del feed (Figma · Tabs de Inicio): "Para ti (Popular)" y "Siguiendo". */
export type HomeFeedTab = 'popular' | 'following'
export const FEED_TAB_PARAM = 'feed'
export const FOLLOWING_VALUE = 'siguiendo'
export const feedTabFromParam = (value: string | null): HomeFeedTab => (value === FOLLOWING_VALUE ? 'following' : 'popular')

/** Reseña del feed con lo reseñado (para la cabecera de la ReviewCard). */
export interface FeedReview {
  review: Review
  target: DemoTarget
}

/** Mezcla al azar (Fisher-Yates) y devuelve los primeros `count`. */
export function sampleRandom<T>(items: readonly T[], count: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

/**
 * Orden de "Para ti (Popular)": más Me gusta primero; en empate se conserva el orden al azar, para
 * que las reseñas sin calificación (permitidas, 2026-11-15) no queden siempre al final. Hoy
 * `likes_count` siempre es 0 (LIKE-01), así que el orden es al azar.
 */
export function byPopularity(a: FeedReview, b: FeedReview): number {
  return b.review.likes_count - a.review.likes_count
}
