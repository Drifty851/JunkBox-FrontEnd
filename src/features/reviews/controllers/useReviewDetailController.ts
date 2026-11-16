import { useParams } from 'react-router'
import { useAuth } from '../../auth/controllers/authContext'
import { useLoad } from '../../catalog/controllers/useLoad'
import type { CommentNode } from '../models/reviewDetail'
import { loadReviewDetail } from '../services/reviewDetailService'

/** Hasta COM-01 no hay comentarios que leer: hilo vacío y sin total. */
const NO_COMMENTS: CommentNode[] = []

/**
 * Controlador de la Reseña Completa: la reseña y lo reseñado son reales (GET /reviews/{id} y
 * GET /music/…); los comentarios, sus respuestas y los Me gusta esperan al backend (COM-01,
 * LIKE-01, LIKE-02). Cuando existan, aquí se cargará la lista plana y se armará el hilo con
 * `buildCommentTree`.
 */
export function useReviewDetailController() {
  const { user } = useAuth()
  const { id = '' } = useParams()
  const [state, retry] = useLoad(id, loadReviewDetail)
  return { user, state, retry, comments: NO_COMMENTS, commentsTotal: null }
}
