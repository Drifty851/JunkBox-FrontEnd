import { useCallback, useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { cursorErrorMessage, useCursorList, type CursorPage } from '../../../shared/hooks/useCursorList'
import { useInfiniteScroll } from '../../../shared/hooks/useInfiniteScroll'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import { useFollow } from '../../social/controllers/socialContext'
import type { ConnectionUser } from '../../social/models/social.types'
import { socialService } from '../../social/services/socialService'
import { connectionsPath, panelId, PROFILE_PATH, tabId, userProfilePath, type ConnectionsTab } from '../models/profile'
import { ProfileTabList, type TabItem } from './ProfileTabs'
import { UserCard } from './UserCard'

const EMPTY_TEXT: Record<ConnectionsTab, { own: string; other: string }> = {
  followers: { own: 'Aquí aparecerán las personas que te siguen.', other: 'Aquí aparecerán las personas que lo siguen.' },
  following: { own: 'Aquí aparecerán las personas que sigues.', other: 'Aquí aparecerán las personas que sigue.' },
}

const RETRY_CLASSES =
  'cursor-pointer text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

const connectionId = (person: ConnectionUser) => person.id

/** Fila de la lista: la tarjeta SuggestedUser con Seguir real; en mi propia fila, sin botón. */
function ConnectionRow({ person, isMe }: { person: ConnectionUser; isMe: boolean }) {
  const follow = useFollow(person.id, person.followed_by_me)
  return (
    <UserCard
      user={{ username: person.username, displayName: person.display_name, avatarUrl: person.avatar_url }}
      follow={isMe ? undefined : { following: follow.following, pending: follow.pending, onToggle: follow.toggle }}
    />
  )
}

function RowSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <li key={index} aria-hidden="true" className="flex w-full items-center gap-3">
      <span className="size-9 shrink-0 rounded-full bg-surface-input-disabled motion-safe:animate-pulse" />
      <span className="h-4 w-40 rounded bg-surface-input-disabled motion-safe:animate-pulse" />
    </li>
  ))
}

/**
 * Seguidores y seguidos (decisión del propietario, 2026-11-15): página con dos pestañas por ruta
 * (/perfil/seguidores · /perfil/seguidos, o /usuario/:username/...). No está en Figma: reutiliza la
 * cabecera de Configuración (flecha atrás + título), las Tabs del perfil y, para cada persona, la
 * tarjeta SuggestedUser (UserCard).
 * Datos reales (2026-11-19): GET /users/{username}/followers | /following, con scroll infinito y
 * Seguir en cada fila. Dejar de seguir deja la fila con "Seguir" hasta volver a abrir la lista
 * (decisión del propietario).
 */
export function ConnectionsPage({ tab }: { tab: ConnectionsTab }) {
  const { user, logout } = useAuth()
  const { username } = useParams()
  const navigate = useNavigate()
  const isOwn = !username || username === user?.username
  const owner = isOwn ? null : (username ?? null)
  // Mis listas se piden por id (el username de cuentas antiguas puede no servir en la URL).
  const lookup = owner ?? user?.id ?? ''
  const title = owner ? `@${owner}` : 'Mis conexiones'
  const tabs: TabItem<ConnectionsTab>[] = [
    { id: 'followers', label: 'Seguidores', to: connectionsPath('followers', owner) },
    { id: 'following', label: 'Seguidos', to: connectionsPath('following', owner) },
  ]

  const loadPage = useCallback(
    async (cursor: string | null, signal: AbortSignal): Promise<CursorPage<ConnectionUser>> => {
      const page = await socialService.getConnectionsPage(lookup, tab, cursor, signal)
      return { items: page.users, nextCursor: page.next_cursor }
    },
    [lookup, tab],
  )
  const toMessage = useMemo(() => cursorErrorMessage(logout, toUserMessage), [logout])
  const { state, loadMore, retry } = useCursorList(`${lookup}:${tab}`, { loadPage, getId: connectionId, toMessage })
  const canLoadMore = state.status === 'ready' && state.hasMore && !state.loadingMore && state.moreError === null
  const sentinelRef = useInfiniteScroll(loadMore, canLoadMore)

  useEffect(() => {
    const previous = document.title
    document.title = `${tab === 'followers' ? 'Seguidores' : 'Seguidos'} · ${owner ? `@${owner}` : 'Mi perfil'} · Junkbox`
    return () => {
      document.title = previous
    }
  }, [tab, owner])

  // /usuario/<mi usuario>/seguidores son los míos.
  if (username && isOwn) return <Navigate to={connectionsPath(tab)} replace />

  return (
    <div className="flex w-full flex-col gap-4 px-4 pt-3 pb-4 md:gap-6 md:px-20 md:py-8">
      <header className="flex items-center gap-3">
        <Link
          to={owner ? userProfilePath(owner) : PROFILE_PATH}
          aria-label="Volver al perfil"
          className="flex rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <MaskIcon src={arrowLeftIcon} size={20} className="bg-fg" />
        </Link>
        <h1 className="min-w-0 truncate text-2xl leading-[1.4] font-bold text-fg md:text-[32px]">{title}</h1>
      </header>

      <ProfileTabList
        tabs={tabs}
        active={tab}
        label="Seguidores y seguidos"
        onSelect={(next) => navigate(connectionsPath(next, owner), { replace: true })}
      />

      <section
        id={panelId(tab)}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        aria-busy={state.status === 'loading' || (state.status === 'ready' && state.loadingMore)}
        className="flex w-full flex-col gap-3 md:max-w-[640px]"
      >
        {state.status === 'loading' ? (
          <>
            <p className="sr-only">Cargando…</p>
            <ul className="flex flex-col gap-4">
              <RowSkeletons count={4} />
            </ul>
          </>
        ) : state.status === 'error' ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert message={state.message} />
            <button type="button" onClick={retry} className={RETRY_CLASSES}>
              Reintentar
            </button>
          </div>
        ) : state.items.length === 0 ? (
          <p className="text-sm leading-[1.4] text-fg-muted">{EMPTY_TEXT[tab][owner ? 'other' : 'own']}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {state.items.map((person) => (
                <ConnectionRow key={person.id} person={person} isMe={person.id === user?.id} />
              ))}
              {state.loadingMore && <RowSkeletons count={2} />}
            </ul>
            {state.moreError !== null && (
              <div className="flex flex-col items-start gap-2">
                <FormAlert message={state.moreError} />
                <button type="button" onClick={loadMore} className={RETRY_CLASSES}>
                  Reintentar
                </button>
              </div>
            )}
            {state.hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}
          </>
        )}
      </section>
    </div>
  )
}
