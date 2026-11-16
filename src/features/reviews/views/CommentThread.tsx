import { useId, useState } from 'react'
import { Link } from 'react-router'
import sendIcon from '../../../assets/icons/send-18.svg'
import { Avatar } from '../../../shared/ui/Avatar'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatRelativeTime } from '../../../shared/utils/formatTime'
import type { UserProfile } from '../../auth/models/auth.types'
import { userProfilePath } from '../../profile/models/profile'
import { countReplies, MAX_COMMENT_INDENT, type CommentNode } from '../models/reviewDetail'

/** Sin endpoints de comentarios ni Me gusta (COM-01, LIKE-02). */
const PENDING = 'Disponible cuando el backend lo permita'

const authorName = (node: CommentNode) => node.comment.author.display_name?.trim() || node.comment.author.username

/**
 * CommentCard (Figma 14296:8890): avatar 28, separación 8; nombre Caption/12 SemiBold y hora
 * Caption/11 en text/secondary-2; texto Body/13; "♡ 12 · Responder" en Caption/11 text/secondary-2.
 * Respuestas anidadas (decisión del propietario, 2026-11-15; no está en Figma): sangría bajo el
 * avatar hasta MAX_COMMENT_INDENT niveles; más abajo siguen en ese nivel con "Respondiendo a
 * @usuario". Cada comentario con respuestas se puede contraer.
 */
function CommentItem({ node, depth, replyingTo }: { node: CommentNode; depth: number; replyingTo: string | null }) {
  const [open, setOpen] = useState(true)
  const repliesId = useId()
  const { comment } = node
  const name = authorName(node)
  const total = countReplies(node)
  const nested = depth < MAX_COMMENT_INDENT

  return (
    <li className="flex w-full flex-col gap-4">
      <article aria-label={`Comentario de ${name}`} className="flex w-full items-start gap-2">
        <Link to={userProfilePath(comment.author.username)} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <Avatar src={comment.author.avatar_url} fallbackSrc={defaultAvatarUrl(comment.author.username)} alt="" className="size-7" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
          <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
            <Link
              to={userProfilePath(comment.author.username)}
              className="truncate rounded text-xs font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              {name}
            </Link>
            <span className="text-[11px] text-fg-placeholder">{formatRelativeTime(comment.created_at)}</span>
          </p>
          <p className="text-[13px] break-words whitespace-pre-line text-fg">
            {replyingTo && <span className="text-fg-placeholder">Respondiendo a @{replyingTo} </span>}
            {comment.content}
          </p>
          <p className="flex flex-wrap items-center gap-x-1 text-[11px] text-fg-placeholder">
            <span aria-disabled="true" title={PENDING} aria-label={`${comment.likes_count} Me gusta`}>
              ♡ {comment.likes_count}
            </span>
            <span aria-hidden="true">·</span>
            <span aria-disabled="true" title={PENDING}>
              Responder
            </span>
            {total > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={repliesId}
                  onClick={() => setOpen((value) => !value)}
                  className="cursor-pointer rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  {open ? 'Ocultar respuestas' : total === 1 ? 'Ver 1 respuesta' : `Ver ${total} respuestas`}
                </button>
              </>
            )}
          </p>
        </div>
      </article>
      {total > 0 && open && (
        <ul id={repliesId} aria-label={`Respuestas a ${name}`} className={cn('flex flex-col gap-4', nested && 'ml-9')}>
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.comment.id}
              node={reply}
              depth={nested ? depth + 1 : depth}
              replyingTo={nested ? null : comment.author.username}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * CommentInput (Figma 14296:5773): borde `line`, radio 8, padding 12, separación 8; avatar 24,
 * texto Body/13 y "send" 18. Deshabilitado hasta COM-01.
 */
function CommentInput({ user }: { user: UserProfile | null }) {
  const inputId = useId()
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-line p-3">
      <Avatar
        src={user?.avatar_url ?? null}
        fallbackSrc={user ? defaultAvatarUrl(user.username) : null}
        alt=""
        className="size-6 shrink-0"
      />
      <label htmlFor={inputId} className="sr-only">
        Agrega un comentario
      </label>
      <input
        id={inputId}
        type="text"
        disabled
        title={PENDING}
        placeholder="Agrega un comentario…"
        className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-[13px] leading-[1.4] text-fg placeholder:text-fg-placeholder focus:outline-none"
      />
      <button type="button" disabled aria-label="Enviar comentario" title={PENDING} className="flex shrink-0 cursor-not-allowed">
        <MaskIcon src={sendIcon} size={18} className="bg-fg" />
      </button>
    </div>
  )
}

/**
 * CommentThread (Figma · ExpandedComments): SectionHeader "Comentarios (24)" Title/18 + "Más
 * recientes⌄", comentarios separados 24 y la caja para comentar. En escritorio va en un panel con
 * borde de 400 px (padding 24); en móvil, debajo de la reseña, sin borde.
 */
export function CommentThread({ comments, total, user }: { comments: CommentNode[]; total: number | null; user: UserProfile | null }) {
  return (
    <section
      aria-labelledby="review-comments-title"
      className="flex w-full flex-col gap-6 xl:w-[400px] xl:shrink-0 xl:rounded-lg xl:border xl:border-line xl:p-6"
    >
      <div className="flex w-full items-center justify-between leading-[1.4] whitespace-nowrap">
        <h2 id="review-comments-title" className="text-lg font-semibold text-fg">
          {total === null ? 'Comentarios' : `Comentarios (${total})`}
        </h2>
        <span aria-disabled="true" className="text-xs text-fg-placeholder">
          Más recientes<span aria-hidden="true">⌄</span>
        </span>
      </div>
      {comments.length > 0 ? (
        <ul aria-label="Comentarios" className="flex w-full flex-col gap-6">
          {comments.map((node) => (
            <CommentItem key={node.comment.id} node={node} depth={1} replyingTo={null} />
          ))}
        </ul>
      ) : (
        <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-dashed border-line px-4 py-6">
          <p className="text-sm leading-[1.4] text-fg">Aquí aparecerán los comentarios y sus respuestas.</p>
          <p className="text-xs leading-[1.4] text-fg-placeholder">Pendiente del backend.</p>
        </div>
      )}
      <CommentInput user={user} />
    </section>
  )
}
