import type { ReviewTargetType } from './review.types'

/** Ruta de Escribir Reseña. El objetivo va en `?tipo=song|album|artist&id=…` (opcional). */
export const WRITE_REVIEW_PATH = '/resena/nueva'

export function writeReviewPath(type: ReviewTargetType, id: string): string {
  return `${WRITE_REVIEW_PATH}?${new URLSearchParams({ tipo: type, id }).toString()}`
}

export function isReviewTargetType(value: string | null): value is ReviewTargetType {
  return value === 'song' || value === 'album' || value === 'artist'
}

/** Límite de Figma ("0 / 2.000"). El backend admite hasta 5000. */
export const REVIEW_MAX_LENGTH = 2000
/** Mínimo del backend (`content` de 5 a 5000 caracteres, contados en runas). */
export const REVIEW_MIN_LENGTH = 5

/** Escala del backend: de 0.5 a 5.0 en pasos de 0.5. */
export const RATING_STEP = 0.5
export const RATING_MAX = 5

/**
 * Texto de cada nivel (Figma solo define "5 de 5 · Brutal"; el resto es propuesta).
 */
const RATING_LABELS: Record<number, string> = {
  0.5: 'Nada para mí',
  1: 'Malo',
  1.5: 'Flojo',
  2: 'Regular',
  2.5: 'Pasable',
  3: 'Bueno',
  3.5: 'Muy bueno',
  4: 'Excelente',
  4.5: 'Increíble',
  5: 'Brutal',
}

export function ratingLabel(score: number): string {
  return RATING_LABELS[score] ?? ''
}

/** Cuenta caracteres como el backend (runas / code points, no unidades UTF-16). */
export function countCharacters(text: string): number {
  return [...text].length
}

export interface WriteReviewValues {
  /** 0 = sin calificar todavía. */
  score: number
  content: string
}

export type WriteReviewErrors = Partial<Record<'score' | 'content', string>>

/**
 * Regla del propietario (2026-11-15): se puede calificar sin reseñar, reseñar sin calificar o las
 * dos cosas, pero no ninguna.
 */
export function validateWriteReview(values: WriteReviewValues, hasExistingReview: boolean): WriteReviewErrors {
  const errors: WriteReviewErrors = {}
  const length = countCharacters(values.content.trim())
  const rated = values.score >= RATING_STEP
  if (!rated && length === 0 && !hasExistingReview) {
    errors.score = 'Califica con estrellas, escribe una reseña o las dos.'
  } else if (length === 0 && hasExistingReview) {
    errors.content = 'Escribe tu reseña o usa «Eliminar mi reseña».'
  } else if (length > 0 && length < REVIEW_MIN_LENGTH) {
    errors.content = `La reseña debe tener al menos ${REVIEW_MIN_LENGTH} caracteres.`
  } else if (length > REVIEW_MAX_LENGTH) {
    errors.content = `La reseña no puede superar ${REVIEW_MAX_LENGTH.toLocaleString('es-ES', { useGrouping: 'always' })} caracteres.`
  }
  return errors
}
