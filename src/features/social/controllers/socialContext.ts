import { createContext, useCallback, useContext } from 'react'

/** Me gusta de una reseña tal como se muestra. */
export interface LikeState {
  liked: boolean
  count: number
}

export interface SocialContextValue {
  /** Lo que el usuario cambió en esta sesión, por id de persona (true = la sigue). */
  following: ReadonlyMap<string, boolean>
  /** Lo que el usuario cambió en esta sesión, por id de reseña. */
  likes: ReadonlyMap<string, LikeState>
  /** Peticiones en curso: `follow:<id>` y `like:<id>`. */
  pending: ReadonlySet<string>
  setFollowing: (userId: string, follow: boolean) => void
  setLiked: (reviewId: string, like: boolean, currentCount: number) => void
}

export const SocialContext = createContext<SocialContextValue | null>(null)

export const followKey = (userId: string) => `follow:${userId}`
export const likeKey = (reviewId: string) => `like:${reviewId}`

/** Acceso al estado social. Debe usarse dentro de <SocialProvider> (src/app/App.tsx). */
function useSocial(): SocialContextValue {
  const value = useContext(SocialContext)
  if (!value) throw new Error('useSocial debe usarse dentro de <SocialProvider>.')
  return value
}

/**
 * Seguir a una persona. `serverFollowing` es lo que dice la respuesta del backend (`following_author`,
 * `followed_by_me`); si el usuario lo cambió en esta sesión, manda ese cambio (todas las tarjetas de
 * la misma persona quedan iguales).
 */
export function useFollow(userId: string, serverFollowing: boolean) {
  const { following, pending, setFollowing } = useSocial()
  const value = following.get(userId) ?? serverFollowing
  const busy = pending.has(followKey(userId))
  const toggle = useCallback(() => {
    if (!busy) setFollowing(userId, !value)
  }, [busy, setFollowing, userId, value])
  return { following: value, pending: busy, toggle }
}

/** Me gusta de una reseña, con el mismo criterio que `useFollow`. */
export function useLike(reviewId: string, serverLiked: boolean, serverCount: number) {
  const { likes, pending, setLiked } = useSocial()
  const value = likes.get(reviewId) ?? { liked: serverLiked, count: serverCount }
  const busy = pending.has(likeKey(reviewId))
  const toggle = useCallback(() => {
    if (!busy) setLiked(reviewId, !value.liked, value.count)
  }, [busy, setLiked, reviewId, value.liked, value.count])
  return { liked: value.liked, count: value.count, pending: busy, toggle }
}
