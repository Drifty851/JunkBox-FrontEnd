import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { socialService } from '../services/socialService'
import { followKey, likeKey, SocialContext, type LikeState, type SocialContextValue } from './socialContext'

interface SocialStore {
  /** Usuario de la sesión: al cambiar (o cerrar sesión) el estado empieza de cero. */
  owner: string | null
  following: Map<string, boolean>
  likes: Map<string, LikeState>
  pending: Set<string>
}

const emptyStore = (owner: string | null): SocialStore => ({ owner, following: new Map(), likes: new Map(), pending: new Set() })

/**
 * Estado social compartido (decisión del propietario, 2026-11-19): Seguir y Me gusta quedan
 * sincronizados en todas las tarjetas sin recargar. Guarda solo lo que el usuario cambia en la
 * sesión; el resto sale de cada respuesta del backend. Los cambios se muestran al instante y, si el
 * backend falla, se revierten (un 401 sin renovación cierra la sesión). Vive en src/app/App.tsx.
 */
export function SocialProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const userId = user?.id ?? null
  const [store, setStore] = useState<SocialStore>(() => emptyStore(userId))
  // Al cambiar de usuario el estado anterior no se usa (se deriva por dueño, sin efecto).
  const empty = useMemo(() => emptyStore(userId), [userId])
  const current = store.owner === userId ? store : empty

  /** Aplica un cambio sobre el estado del usuario actual. */
  const change = useCallback(
    (apply: (draft: SocialStore) => void) =>
      setStore((previous) => {
        const base = previous.owner === userId ? previous : emptyStore(userId)
        const draft: SocialStore = {
          owner: base.owner,
          following: new Map(base.following),
          likes: new Map(base.likes),
          pending: new Set(base.pending),
        }
        apply(draft)
        return draft
      }),
    [userId],
  )

  const onError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) void logout()
    },
    [logout],
  )

  const setFollowing = useCallback(
    (targetId: string, follow: boolean) => {
      const key = followKey(targetId)
      change((draft) => {
        draft.following.set(targetId, follow)
        draft.pending.add(key)
      })
      socialService
        .setFollowing(targetId, follow)
        .then((profile) =>
          change((draft) => {
            draft.following.set(targetId, profile.followed_by_me)
            draft.pending.delete(key)
          }),
        )
        .catch((error: unknown) => {
          change((draft) => {
            draft.following.set(targetId, !follow)
            draft.pending.delete(key)
          })
          onError(error)
        })
    },
    [change, onError],
  )

  const setLiked = useCallback(
    (reviewId: string, like: boolean, currentCount: number) => {
      const key = likeKey(reviewId)
      change((draft) => {
        draft.likes.set(reviewId, { liked: like, count: Math.max(0, currentCount + (like ? 1 : -1)) })
        draft.pending.add(key)
      })
      socialService
        .setLiked(reviewId, like)
        .then((result) =>
          change((draft) => {
            draft.likes.set(reviewId, { liked: result.liked, count: result.likes_count })
            draft.pending.delete(key)
          }),
        )
        .catch((error: unknown) => {
          change((draft) => {
            draft.likes.set(reviewId, { liked: !like, count: currentCount })
            draft.pending.delete(key)
          })
          onError(error)
        })
    },
    [change, onError],
  )

  const value = useMemo<SocialContextValue>(
    () => ({ following: current.following, likes: current.likes, pending: current.pending, setFollowing, setLiked }),
    [current.following, current.likes, current.pending, setFollowing, setLiked],
  )

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}
