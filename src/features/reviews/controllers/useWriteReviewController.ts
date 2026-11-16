import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import { albumPath, artistPath, songPath } from '../../catalog/models/catalogPaths'
import { useLoad, type LoadState } from '../../catalog/controllers/useLoad'
import { catalogService } from '../../music/services/catalogService'
import type { Rating, Review, ReviewTargetType } from '../models/review.types'
import {
  isReviewTargetType,
  RATING_STEP,
  validateWriteReview,
  type WriteReviewErrors,
  type WriteReviewValues,
} from '../models/writeReview'
import { reviewsService } from '../services/reviewsService'

/** Elemento que se califica/reseña (SelectedMusicPreview de Figma). */
export interface ReviewTargetView {
  type: ReviewTargetType
  /** Id que acepta el backend: ID de Spotify (canción) o UUID local (álbum, artista). */
  id: string
  title: string
  /** "Hoke · BBO · Canción". */
  subtitle: string
  imageUrl: string | null
  /** Ficha a la que se vuelve al publicar o cancelar. */
  href: string
}

export interface MyContribution {
  rating: Rating | null
  review: Review | null
}

/** Carga el objetivo. `key` = "<tipo>:<id>". */
async function loadTarget(key: string, signal: AbortSignal): Promise<ReviewTargetView> {
  const [type, ...rest] = key.split(':')
  const id = rest.join(':')
  if (type === 'song') {
    const track = await catalogService.getTrack(id, signal)
    return {
      type: 'song',
      id: track.spotify_id,
      title: track.track_name,
      subtitle: [track.artist_name, track.album_title, 'Canción'].filter(Boolean).join(' · '),
      imageUrl: track.album_image_url,
      href: songPath(track.spotify_id),
    }
  }
  if (type === 'album') {
    const album = await catalogService.getAlbum(id, signal)
    return {
      type: 'album',
      id: album.id,
      title: album.title,
      subtitle: [album.artist_name, album.album_type === 'single' ? 'Sencillo' : 'Álbum'].join(' · '),
      imageUrl: album.image_url,
      href: albumPath(album.id),
    }
  }
  const artist = await catalogService.getArtist(id, signal)
  return {
    type: 'artist',
    id: artist.id,
    title: artist.name,
    subtitle: 'Artista',
    imageUrl: artist.image_url,
    href: artistPath(artist.id),
  }
}

/** Mi calificación y mi reseña del objetivo. `key` = JSON [tipo, id, userId]. */
async function loadMine(key: string, signal: AbortSignal): Promise<MyContribution> {
  const [type, id, userId] = JSON.parse(key) as [ReviewTargetType, string, string]
  const [rating, review] = await Promise.all([
    reviewsService.getMyRating(type, id, signal),
    reviewsService.findMyReview(type, id, userId, signal),
  ])
  return { rating, review }
}

export interface WriteReviewController {
  target: LoadState<ReviewTargetView>
  mine: LoadState<MyContribution>
  values: WriteReviewValues
  fieldErrors: WriteReviewErrors
  formError: string | null
  submitting: boolean
  setScore: (score: number) => void
  setContent: (content: string) => void
  /** Elige el objetivo desde el buscador de la pantalla. */
  chooseTarget: (type: ReviewTargetType, id: string) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  removeRating: () => void
  removeReview: () => void
  cancel: () => void
}

/**
 * Controlador de Escribir Reseña (módulo Calificaciones y Reseñas).
 *  - El objetivo sale de la URL (`?tipo&id`), así se llega desde "Calificar / Reseñar" de una
 *    ficha o, sin objetivo, desde "Crear Reseña".
 *  - Precarga mi calificación (GET /ratings/my) y mi reseña (REV-02: buscándola en GET /reviews).
 *  - Publicar: POST /ratings (obligatorio) y, si hay texto, POST /reviews (o PUT si ya existe).
 *    Después vuelve a la ficha, que muestra el promedio nuevo.
 */
export function useWriteReviewController(): WriteReviewController {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const rawType = params.get('tipo')
  const rawId = params.get('id')?.trim() ?? ''
  const targetKey = isReviewTargetType(rawType) && rawId !== '' ? `${rawType}:${rawId}` : null

  const [target] = useLoad(targetKey, loadTarget)
  const resolved = target.status === 'ready' ? target.data : null
  const mineKey = resolved && user ? JSON.stringify([resolved.type, resolved.id, user.id]) : null
  const [mine, retryMine] = useLoad(mineKey, loadMine)

  // Borrador ligado a su objetivo: mientras no se toca, refleja lo que ya publiqué.
  const [draft, setDraft] = useState<{ key: string; values: WriteReviewValues } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<WriteReviewErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const existing = mine.status === 'ready' ? mine.data : null
  const defaults: WriteReviewValues = {
    score: existing?.rating?.score ?? 0,
    content: existing?.review?.content ?? '',
  }
  const values = draft !== null && draft.key === mineKey ? draft.values : defaults

  function update(patch: Partial<WriteReviewValues>) {
    if (mineKey === null) return
    setDraft({ key: mineKey, values: { ...values, ...patch } })
    setFieldErrors((errors) => ({ ...errors, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }))
    setFormError(null)
  }

  const fail = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return
    setFormError(toUserMessage(error))
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!resolved || !user || submitting) return
      const errors = validateWriteReview(values, existing?.review != null)
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return
      setSubmitting(true)
      setFormError(null)
      const content = values.content.trim()
      // Calificar es opcional si hay reseña (2026-11-15).
      const rating = values.score >= RATING_STEP ? reviewsService.rate(resolved.type, resolved.id, values.score) : Promise.resolve(null)
      rating
        .then(() =>
          content === ''
            ? null
            : reviewsService.saveReview(resolved.type, resolved.id, content, existing?.review?.id ?? null, user.id),
        )
        .then(() => navigate(resolved.href))
        .catch((error: unknown) => {
          fail(error)
          setSubmitting(false)
        })
    },
    [resolved, user, submitting, values, existing, navigate, fail],
  )

  const remove = useCallback(
    (action: () => Promise<unknown>) => {
      if (submitting) return
      setSubmitting(true)
      setFormError(null)
      action()
        .then(() => {
          setDraft(null)
          retryMine()
        })
        .catch(fail)
        .finally(() => setSubmitting(false))
    },
    [submitting, retryMine, fail],
  )

  return {
    target,
    mine,
    values,
    fieldErrors,
    formError,
    submitting,
    setScore: (score) => update({ score }),
    setContent: (content) => update({ content }),
    chooseTarget: (type, id) => {
      setDraft(null)
      setFieldErrors({})
      setFormError(null)
      setParams({ tipo: type, id }, { replace: true })
    },
    handleSubmit,
    removeRating: () => {
      const rating = existing?.rating
      if (rating) remove(() => reviewsService.deleteRating(rating.id))
    },
    removeReview: () => {
      const review = existing?.review
      if (review) remove(() => reviewsService.deleteReview(review.id))
    },
    cancel: () => (resolved ? navigate(resolved.href) : navigate(-1)),
  }
}
