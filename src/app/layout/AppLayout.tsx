import { Outlet } from 'react-router'
import { useAuth } from '../../features/auth/controllers/authContext'
import { NavbarSearch } from '../../features/search/views/NavbarSearch'
import { BottomBar } from '../../shared/layout/BottomBar'
import { Navbar } from '../../shared/layout/Navbar'
import { defaultAvatarUrl } from '../../shared/utils/defaultAvatar'
import { BOTTOM_BAR_ITEMS, CREATE_REVIEW_ITEM, NAVBAR_LINKS, SETTINGS_PATH } from './navigation'

/**
 * Estructura común de las pantallas con sesión (Figma: Navbar arriba y, en móvil,
 * BottomBar abajo). Cada módulo pinta su contenido en <Outlet />.
 * El MiniPlayer de Figma no se incluye hasta que haya reproducción de audio.
 */
export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Navbar
        links={NAVBAR_LINKS}
        createReviewTo={CREATE_REVIEW_ITEM.to}
        search={<NavbarSearch />}
        account={
          user
            ? {
                username: user.username,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                fallbackAvatarUrl: defaultAvatarUrl(user.username),
              }
            : null
        }
        settingsTo={SETTINGS_PATH}
        onLogout={logout}
      />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <BottomBar items={BOTTOM_BAR_ITEMS} />
    </div>
  )
}
