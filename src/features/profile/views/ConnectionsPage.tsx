import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { useAuth } from '../../auth/controllers/authContext'
import { connectionsPath, panelId, PROFILE_PATH, tabId, userProfilePath, type ConnectionsTab } from '../models/profile'
import { PendingList, ProfileTabList, type TabItem } from './ProfileTabs'

const EMPTY_TEXT: Record<ConnectionsTab, { own: string; other: string }> = {
  followers: { own: 'Aquí aparecerán las personas que te siguen.', other: 'Aquí aparecerán las personas que lo siguen.' },
  following: { own: 'Aquí aparecerán las personas que sigues.', other: 'Aquí aparecerán las personas que sigue.' },
}

/**
 * Seguidores y seguidos (decisión del propietario, 2026-11-15): página con dos pestañas por ruta
 * (/perfil/seguidores · /perfil/seguidos, o /usuario/:username/...). No está en Figma: reutiliza la
 * cabecera de Configuración (flecha atrás + título), las Tabs del perfil y, para cada persona, la
 * tarjeta SuggestedUser (UserCard). Sin endpoint para las listas (FOL-02): estado pendiente.
 */
export function ConnectionsPage({ tab }: { tab: ConnectionsTab }) {
  const { user } = useAuth()
  const { username } = useParams()
  const navigate = useNavigate()
  const isOwn = !username || username === user?.username
  const owner = isOwn ? null : (username ?? null)
  const title = owner ? `@${owner}` : 'Mis conexiones'
  const tabs: TabItem<ConnectionsTab>[] = [
    { id: 'followers', label: 'Seguidores', to: connectionsPath('followers', owner) },
    { id: 'following', label: 'Seguidos', to: connectionsPath('following', owner) },
  ]

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

      <section id={panelId(tab)} role="tabpanel" aria-labelledby={tabId(tab)} className="flex w-full flex-col gap-3 md:max-w-[640px]">
        <PendingList>{EMPTY_TEXT[tab][owner ? 'other' : 'own']}</PendingList>
      </section>
    </div>
  )
}
