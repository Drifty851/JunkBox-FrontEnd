import { Link } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import { cn } from '../../../shared/utils/cn'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatCount } from '../../../shared/utils/formatRating'
import { userProfilePath } from '../../profile/models/profile'
import type { UserResult } from '../models/search.types'

/** Sin endpoint para seguir (FOL-01). */
const FOLLOW_PENDING = 'Seguir estará disponible cuando el backend lo permita.'

/**
 * UserCard del Buscador (Figma 14296:9131): borde `line`, radio 8, separación 12; padding 12 y
 * avatar 40 en móvil (botón de 32), padding 24 y avatar 56 en escritorio (botón de 44); nombre Title/16 SemiBold, @usuario Caption/12 y Button 44 "Seguir" (Variant=Follow,
 * color de acción) o "Siguiendo" (Variant=Following, blanco con borde); "N seguidores" en Caption/12.
 * Sin bio (decisión del propietario, 2026-11-15). Toda la tarjeta abre el perfil; el botón queda
 * por encima del enlace. Sin datos hasta SEARCH-04.
 */
export function UserResultCard({ user }: { user: UserResult }) {
  const name = user.displayName || user.username
  return (
    <li className="relative flex w-full flex-col gap-3 rounded-lg border border-line p-3 md:p-6">
      <div className="flex w-full items-center gap-3">
        <Avatar src={user.avatarUrl} fallbackSrc={defaultAvatarUrl(user.username)} alt="" className="size-10 shrink-0 md:size-14" />
        <div className="flex min-w-0 flex-1 flex-col leading-[1.4] whitespace-nowrap">
          <Link
            to={userProfilePath(user.username)}
            className="truncate text-base font-semibold text-fg after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-fg"
          >
            {name}
          </Link>
          <p className="truncate text-xs text-fg-placeholder">@{user.username}</p>
        </div>
        <button
          type="button"
          aria-disabled="true"
          aria-label={`${user.following ? 'Dejar de seguir' : 'Seguir'} a ${name}`}
          title={FOLLOW_PENDING}
          className={cn(
            'relative z-[1] flex h-8 shrink-0 cursor-default items-center justify-center rounded-lg border px-3 md:h-11 md:px-4 text-sm leading-[1.4] font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            user.following ? 'border-line bg-surface-quickplay text-fg' : 'border-action bg-action text-on-action',
          )}
        >
          {user.following ? 'Siguiendo' : 'Seguir'}
        </button>
      </div>
      <p className="text-xs leading-[1.4] text-fg-placeholder">
        {user.followersCount === 1 ? '1 seguidor' : `${formatCount(user.followersCount)} seguidores`}
      </p>
    </li>
  )
}

/**
 * Buscador · Usuarios (Figma 14244:50943 / 14244:51045). Sin búsqueda de usuarios en el backend
 * (SEARCH-04): la lista muestra el estado pendiente. El panel "La música se descubre mejor en
 * compañía" (CommunityContext) va sin el bloque "Os une …" ni su botón, que necesitan saber qué
 * música tienen en común (decisión del propietario, 2026-11-15); en móvil no se muestra (Figma).
 */
export function UserSearchResults({ query }: { query: string }) {
  return (
    <div className="flex w-full flex-col gap-6 xl:flex-row xl:items-start xl:gap-12">
      <section aria-labelledby="user-results-title" className="flex w-full min-w-0 flex-col gap-3 xl:flex-1">
        <div className="flex w-full items-center justify-between leading-[1.4] whitespace-nowrap">
          <h2 id="user-results-title" className="text-lg font-semibold text-fg">
            Personas con tu misma sintonía
          </h2>
        </div>
        <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-dashed border-line px-4 py-6">
          <p className="text-sm leading-[1.4] text-fg">
            {query === ''
              ? 'Busca personas por su nombre o @usuario.'
              : `Aquí aparecerán las personas que coincidan con “${query}”.`}
          </p>
          <p className="text-xs leading-[1.4] text-fg-placeholder">Pendiente del backend.</p>
        </div>
      </section>
      <aside
        aria-labelledby="community-context-title"
        className="hidden w-full flex-col items-start gap-5 rounded-lg bg-surface-input-disabled p-6 md:flex xl:w-[384px] xl:shrink-0"
      >
        <h2 id="community-context-title" className="text-2xl leading-[1.4] font-bold text-fg">
          La música se descubre mejor en compañía.
        </h2>
        <p className="text-sm leading-[1.4] text-fg-soft">
          Sigue a quienes te inspiran. Sus reseñas aparecerán en la pestaña Siguiendo de tu inicio.
        </p>
      </aside>
    </div>
  )
}
