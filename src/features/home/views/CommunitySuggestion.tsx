import type { LoadState } from '../../catalog/controllers/useLoad'
import { UserCard } from '../../profile/views/UserCard'
import { useFollow } from '../../social/controllers/socialContext'
import type { UserSuggestion } from '../../social/models/social.types'

/** Fila SuggestedUser con Seguir real (2026-11-19). Sugerida = aún no la sigues. */
function SuggestedUser({ user }: { user: UserSuggestion }) {
  const follow = useFollow(user.id, false)
  return (
    <UserCard
      user={{ username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url }}
      detail={user.reason.text}
      follow={{ following: follow.following, pending: follow.pending, onToggle: follow.toggle }}
    />
  )
}

/**
 * "Conecta por lo que suena" (Figma · Community suggestion 14244:50676, solo escritorio): fondo
 * surface/default-3, radio 8, padding 20, separación 16, título Title/18/SemiBold y una fila
 * SuggestedUser con el motivo de la sugerencia (HOME-05). Seguir funciona (2026-11-19): al seguir,
 * la fila queda en "Siguiendo" y el backend deja de sugerirla en la siguiente carga. Mientras
 * carga, si falla o si no hay sugerencias, el panel no se muestra: es secundario y no debe empujar
 * el contenido.
 */
export function CommunitySuggestion({ suggestions }: { suggestions: LoadState<UserSuggestion[]> }) {
  if (suggestions.status !== 'ready' || suggestions.data.length === 0) return null
  return (
    <section aria-labelledby="home-community-title" className="hidden flex-col gap-4 rounded-lg bg-surface-input-disabled p-5 md:flex">
      <h2 id="home-community-title" className="text-lg leading-[1.4] font-semibold text-fg">
        Conecta por lo que suena
      </h2>
      <ul className="flex flex-col gap-4">
        {suggestions.data.map((user) => (
          <SuggestedUser key={user.id} user={user} />
        ))}
      </ul>
    </section>
  )
}
