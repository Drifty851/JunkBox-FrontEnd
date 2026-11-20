import { Link } from 'react-router'
import { Avatar } from '../../../shared/ui/Avatar'
import type { FollowControl } from '../../../shared/ui/FollowButton'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { userProfilePath } from '../models/profile'
import { FollowButton } from './FollowButton'

/** Persona de una lista de seguidores o seguidos (contrato propuesto en FOL-02). */
export interface UserSummary {
  username: string
  displayName: string | null
  avatarUrl: string | null
}

/**
 * SuggestedUser (Figma 14244:50679, "Conecta por lo que suena" en Inicio), reutilizada en
 * Seguidores / Seguidos (decisión del propietario, 2026-11-15): avatar 36, separación 12, nombre
 * Body/14/SemiBold, línea secundaria Caption/12 en text/secondary-2 y botón "Seguir".
 * Toda la tarjeta abre el perfil de la persona; el botón queda por encima del enlace (como MusicRow).
 * Sin datos hasta FOL-02. `detail` reemplaza la línea secundaria (@usuario): en Inicio es el motivo
 * de la sugerencia ("También escucha Hoke", decisión del propietario, 2026-11-19).
 */
export function UserCard({ user, detail, follow }: { user: UserSummary; detail?: string; follow?: FollowControl }) {
  const name = user.displayName || user.username
  return (
    <li className="relative flex w-full items-center gap-3 rounded-lg">
      <Avatar src={user.avatarUrl} fallbackSrc={defaultAvatarUrl(user.username)} alt="" className="size-9 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.4] whitespace-nowrap">
        <Link
          to={userProfilePath(user.username)}
          className="truncate text-sm font-semibold text-fg after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-fg"
        >
          {name}
        </Link>
        <p className="truncate text-xs text-fg-placeholder">{detail ?? `@${user.username}`}</p>
      </div>
      <FollowButton name={name} control={follow} />
    </li>
  )
}
