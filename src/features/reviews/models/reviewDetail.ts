import type { ReviewAuthor } from './review.types'

/** Reseña Completa (Figma 14244:52342 / 14244:52506). `:id` es el UUID de la reseña. */
export const REVIEW_PATH = '/resena/:id'
export const reviewPath = (id: string) => `/resena/${encodeURIComponent(id)}`

/**
 * Comentario de una reseña tal como lo propone COM-01 (SOLICITUDES_BACKEND.md): lista plana en la
 * que cada comentario dice a quién responde (`parent_id`). Las respuestas pueden tener respuestas
 * sin límite (decisión del propietario, 2026-11-15).
 */
export interface ReviewCommentDto {
  id: string
  review_id: string
  parent_id: string | null
  author: ReviewAuthor
  content: string
  likes_count: number
  liked_by_me: boolean
  created_at: string
}

/** Nodo del hilo: el comentario con sus respuestas, de la más antigua a la más reciente. */
export interface CommentNode {
  comment: ReviewCommentDto
  replies: CommentNode[]
}

/**
 * Sangría máxima del hilo (decisión del propietario, 2026-11-15): hasta 3 niveles. Las respuestas
 * más profundas se muestran en el nivel 3 con "Respondiendo a @usuario", para que en móvil (390 px)
 * el texto no se aplaste.
 */
export const MAX_COMMENT_INDENT = 3

/** Largo máximo de un comentario (propuesto en COM-01). */
export const COMMENT_MAX_LENGTH = 1000

/**
 * Arma el hilo a partir de la lista plana. Los comentarios principales van del más reciente al
 * más antiguo ("Más recientes", Figma); las respuestas, en orden de conversación. Una respuesta cuyo
 * padre no llegó se muestra como comentario principal para no perderla.
 */
export function buildCommentTree(comments: ReviewCommentDto[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>()
  for (const comment of comments) nodes.set(comment.id, { comment, replies: [] })
  const roots: CommentNode[] = []
  for (const node of nodes.values()) {
    const parent = node.comment.parent_id ? nodes.get(node.comment.parent_id) : undefined
    if (parent && parent !== node) parent.replies.push(node)
    else roots.push(node)
  }
  const byDate = (a: CommentNode, b: CommentNode) => a.comment.created_at.localeCompare(b.comment.created_at)
  for (const node of nodes.values()) node.replies.sort(byDate)
  return roots.sort((a, b) => byDate(b, a))
}

/** Total de respuestas bajo un comentario (todas las generaciones). */
export function countReplies(node: CommentNode): number {
  return node.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0)
}

/** "Publicada hoy a las 9:31" / "Publicada el 3 de noviembre de 2026 a las 18:05" (Figma). */
export function publishedLabel(iso: string, now: Date = new Date()): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const time = date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
  const sameDay = date.toDateString() === now.toDateString()
  const day = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  return sameDay ? `Publicada hoy a las ${time}` : `Publicada el ${day} a las ${time}`
}
