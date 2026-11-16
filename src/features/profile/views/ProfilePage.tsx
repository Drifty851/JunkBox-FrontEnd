import { useEffect } from 'react'
import { Link } from 'react-router'
import settingsIcon from '../../../assets/icons/settings-20.svg'
import { Avatar } from '../../../shared/ui/Avatar'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { formatCount } from '../../../shared/utils/formatRating'
import { SETTINGS_PATH } from '../../settings/models/settings'
import { useProfileController } from '../controllers/useProfileController'
import { memberSince, panelId, tabId, type ProfileStats } from '../models/profile'
import { ProfileTabList, RatingsTab, ReviewsTab, SinDatos } from './ProfileTabs'

const STAT_LABELS: { key: keyof ProfileStats; label: string }[] = [
  { key: 'reviews', label: 'Reseñas' },
  { key: 'ratings', label: 'Calificaciones' },
  { key: 'followers', label: 'Seguidores' },
  { key: 'following', label: 'Seguidos' },
]

/**
 * Mi perfil · Figma: Perfil Público móvil 14244:52670 / 14263:24037, escritorio 14244:52870 /
 * 14263:24255; Historial de Calificaciones móvil 14244:53034 / 14263:24437, escritorio
 * 14244:53191 / 14263:24605.
 * Decisiones del propietario (2026-11-15): solo mi perfil; sin bio (como en Configuración) y sin
 * "Seguir"; los contadores, las listas y los paneles laterales son plantillas hasta que el backend
 * los dé (PROF-01 a PROF-04). Datos reales: avatar, nombre, @usuario y fecha de alta (GET /auth/me).
 */
export function ProfilePage() {
  const { user, tab, selectTab, stats, summary } = useProfileController()
  const name = user?.display_name || user?.username || ''

  useEffect(() => {
    const previous = document.title
    document.title = 'Mi perfil · Junkbox'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-4 px-4 pt-3 pb-4 md:gap-6 md:px-20 md:py-8">
      {/* Profile toolbar: breadcrumb (Caption/12, text/secondary-2) y engrane 20 a Configuración. */}
      <div className="flex w-full items-start justify-between">
        <p className="text-xs leading-[1.4] text-fg-placeholder">COMUNIDAD / PERFIL PÚBLICO</p>
        <Link
          to={SETTINGS_PATH}
          aria-label="Configuración"
          className="flex rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <MaskIcon src={settingsIcon} size={20} className="bg-fg" />
        </Link>
      </div>

      {/* ProfileHeader (Figma 14296:12528 / 14296:12656): avatar 64/96, nombre 24/32 Bold, @usuario 14. */}
      <header className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-4">
          <Avatar
            src={user?.avatar_url ?? null}
            fallbackSrc={user ? defaultAvatarUrl(user.username) : null}
            alt=""
            className="size-16 md:size-24"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
            <h1 className="truncate text-2xl font-bold text-fg md:text-[32px]">{name}</h1>
            {user && <p className="truncate text-sm text-fg-placeholder">@{user.username}</p>}
          </div>
        </div>

        {/* ProfileStats: valor 20 Bold + etiqueta Caption/11; móvil repartidos, escritorio separación 48. */}
        <dl className="flex w-full items-start justify-between leading-[1.4] whitespace-nowrap md:justify-start md:gap-12">
          {STAT_LABELS.map(({ key, label }) => {
            const value = stats[key]
            return (
              <div key={key} className="flex flex-col-reverse gap-1">
                <dt className="text-[11px] text-fg-placeholder">{label}</dt>
                <dd className="text-xl font-bold text-fg">{value === null ? <SinDatos /> : formatCount(value)}</dd>
              </div>
            )
          })}
        </dl>
      </header>

      <ProfileTabList active={tab} onSelect={selectTab} />

      <div
        id={panelId(tab)}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        className="flex w-full flex-col gap-6 md:gap-6 xl:flex-row xl:items-start xl:gap-12"
      >
        {tab === 'reviews' ? (
          <ReviewsTab memberSince={user ? memberSince(user.created_at) : null} />
        ) : (
          <RatingsTab name={name} summary={summary} />
        )}
      </div>
    </div>
  )
}
