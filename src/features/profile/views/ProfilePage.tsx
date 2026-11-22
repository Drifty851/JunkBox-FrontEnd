import { useEffect } from 'react'
import { Link, Navigate } from 'react-router'
import settingsIcon from '../../../assets/icons/settings-20.svg'
import { Avatar } from '../../../shared/ui/Avatar'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatCount } from '../../../shared/utils/formatRating'
import { DetailError } from '../../catalog/views/DetailParts'
import { SETTINGS_PATH } from '../../settings/models/settings'
import { useProfileController } from '../controllers/useProfileController'
import { connectionsPath, memberSince, panelId, PROFILE_PATH, PROFILE_TAB_PARAM, tabId, type ConnectionsTab, type ProfileStats, type ProfileTab } from '../models/profile'
import { FollowButton } from './FollowButton'
import { ProfileTabList, RatingsTab, ReviewsTab, SinDatos, type TabItem } from './ProfileTabs'

/** Cada contador lleva a su parte: Reseñas y Calificaciones a su pestaña; Seguidores y Seguidos a su página. */
const STAT_LABELS: { key: keyof ProfileStats; label: string; tab?: ProfileTab; connections?: ConnectionsTab }[] = [
  { key: 'reviews', label: 'Reseñas', tab: 'reviews' },
  { key: 'ratings', label: 'Calificaciones', tab: 'ratings' },
  { key: 'followers', label: 'Seguidores', connections: 'followers' },
  { key: 'following', label: 'Seguidos', connections: 'following' },
]

const OWN_TABS: TabItem<ProfileTab>[] = [
  { id: 'reviews', label: 'Mis Reseñas' },
  { id: 'ratings', label: 'Historial de Calificaciones' },
]
const OTHER_TABS: TabItem<ProfileTab>[] = [
  { id: 'reviews', label: 'Reseñas' },
  { id: 'ratings', label: 'Calificaciones' },
]

/**
 * Mi perfil · Figma: Perfil Público móvil 14244:52670 / 14263:24037, escritorio 14244:52870 /
 * 14263:24255; Historial de Calificaciones móvil 14244:53034 / 14263:24437, escritorio
 * 14244:53191 / 14263:24605.
 * Decisiones del propietario (2026-11-15): solo mi perfil; sin bio (como en Configuración) y sin
 * "Seguir"; los contadores, las listas y los paneles laterales son plantillas hasta que el backend
 * los dé (PROF-01 a PROF-04). Datos reales: avatar, nombre, @usuario y fecha de alta (GET /auth/me).
 * Seguidores y Seguidos abren su página (2026-11-15).
 * Datos reales (2026-11-19, GET /users/{username}): Seguidores, Seguidos y Reseñas, y el perfil de
 * otra persona (avatar, nombre, @usuario, Seguir). Si no existe: "No encontramos a @usuario".
 */
export function ProfilePage() {
  const { user, username, isOwn, tab, selectTab, profile, retryProfile, follow, stats, summary } = useProfileController()
  const other = !isOwn && profile.status === 'ready' ? profile.data : null
  const name = isOwn ? user?.display_name || user?.username || '' : other ? other.display_name?.trim() || other.username : `@${username ?? ''}`
  const pageTitle = isOwn ? 'Mi perfil · Junkbox' : `${name} · Junkbox`

  useEffect(() => {
    const previous = document.title
    document.title = pageTitle
    return () => {
      document.title = previous
    }
  }, [pageTitle])

  // /usuario/<mi usuario> es mi perfil.
  if (username && isOwn) return <Navigate to={PROFILE_PATH} replace />

  // Perfil de otra persona que no existe o no se pudo cargar.
  if (!isOwn && profile.status === 'error') {
    return (
      <div className="flex w-full flex-col gap-4 px-4 pt-3 pb-4 md:gap-6 md:px-20 md:py-8">
        <DetailError message={profile.message} notFound={profile.notFound} what={`a @${username ?? ''}`} onRetry={retryProfile} />
      </div>
    )
  }
  const loadingOther = !isOwn && !other

  return (
    <div className="flex w-full flex-col gap-4 px-4 pt-3 pb-4 md:gap-6 md:px-20 md:py-8">
      {/* Profile toolbar: breadcrumb (Caption/12, text/secondary-2) y engrane 20 a Configuración. */}
      <div className="flex w-full items-start justify-between">
        <p className="text-xs leading-[1.4] text-fg-placeholder">COMUNIDAD / PERFIL PÚBLICO</p>
        {isOwn && (
          <Link
            to={SETTINGS_PATH}
            aria-label="Configuración"
            className="flex rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MaskIcon src={settingsIcon} size={20} className="bg-fg" />
          </Link>
        )}
      </div>

      {/* ProfileHeader (Figma 14296:12528 / 14296:12656): avatar 64/96, nombre 24/32 Bold, @usuario 14. */}
      <header className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-4" aria-busy={loadingOther || undefined}>
          {loadingOther ? (
            <>
              <span aria-hidden="true" className="size-16 shrink-0 rounded-full bg-surface-input-disabled motion-safe:animate-pulse md:size-24" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h1 className="sr-only">Cargando el perfil de @{username}</h1>
                <span aria-hidden="true" className="h-7 w-48 rounded bg-surface-input-disabled motion-safe:animate-pulse md:h-9" />
                <span aria-hidden="true" className="h-4 w-28 rounded bg-surface-input-disabled motion-safe:animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <Avatar
                src={isOwn ? (user?.avatar_url ?? null) : (other?.avatar_url ?? null)}
                fallbackSrc={defaultAvatarUrl((isOwn ? user?.username : other?.username) ?? '')}
                alt=""
                className="size-16 md:size-24"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
                <h1 className="truncate text-2xl font-bold text-fg md:text-[32px]">{name}</h1>
                <p className="truncate text-sm text-fg-placeholder">@{isOwn ? user?.username : other?.username}</p>
              </div>
              {other && <FollowButton name={name} control={{ following: follow.following, pending: follow.pending, onToggle: follow.toggle }} />}
            </>
          )}
        </div>

        {/* ProfileStats: valor 20 Bold + etiqueta Caption/11; móvil repartidos, escritorio separación 48. */}
        <dl className="flex w-full items-start justify-between leading-[1.4] whitespace-nowrap md:justify-start md:gap-12">
          {STAT_LABELS.map(({ key, label, tab: statTab, connections }) => {
            const value = stats[key]
            const param = statTab ? PROFILE_TAB_PARAM[statTab] : null
            const target = connections
              ? connectionsPath(connections, isOwn ? null : username)
              : statTab
                ? { search: param ? `?tab=${param}` : '' }
                : null
            return (
              <div key={key} className="relative flex flex-col-reverse gap-1">
                <dt className="text-[11px] text-fg-placeholder">
                  {target ? (
                    <Link
                      to={target}
                      aria-current={statTab && statTab === tab ? 'true' : undefined}
                      className="after:absolute after:inset-0 after:rounded hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-fg"
                    >
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </dt>
                <dd className="text-xl font-bold text-fg">{value === null ? <SinDatos /> : formatCount(value)}</dd>
              </div>
            )
          })}
        </dl>
      </header>

      <ProfileTabList tabs={isOwn ? OWN_TABS : OTHER_TABS} active={tab} onSelect={selectTab} label="Secciones del perfil" />

      <div
        id={panelId(tab)}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        className="flex w-full flex-col gap-6 md:gap-6 xl:flex-row xl:items-start xl:gap-12"
      >
        {tab === 'reviews' ? (
          <ReviewsTab memberSince={isOwn ? (user ? memberSince(user.created_at) : null) : other ? memberSince(other.created_at) : null} own={isOwn} />
        ) : (
          <RatingsTab name={name} summary={summary} own={isOwn} />
        )}
      </div>
    </div>
  )
}
