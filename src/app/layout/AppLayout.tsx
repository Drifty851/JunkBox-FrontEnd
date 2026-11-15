import { Outlet } from 'react-router'
import { useAuth } from '../../features/auth/controllers/authContext'
import { spotifyAuthService } from '../../features/player/services/spotifyAuthService'
import { MiniPlayer } from '../../features/player/views/MiniPlayer'
import { NavbarSearch } from '../../features/search/views/NavbarSearch'
import { BottomBar } from '../../shared/layout/BottomBar'
import { Navbar } from '../../shared/layout/Navbar'
import { defaultAvatarUrl } from '../../shared/utils/defaultAvatar'
import { BOTTOM_BAR_ITEMS, CREATE_REVIEW_ITEM, NAVBAR_LINKS, SETTINGS_PATH } from './navigation'

/**
 * Estructura común de las pantallas con sesión (Figma: Navbar arriba y, en móvil,
 * BottomBar abajo). Cada módulo pinta su contenido en <Outlet />.
 * El MiniPlayer va al pie (encima de la BottomBar en móvil); su estado vive en PlayerProvider
 * (src/app/App.tsx), así que la música sigue al cambiar de pantalla y se detiene al cerrar sesión.
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
        onLogout={async () => {
          // Cerrar sesión borra también la vinculación con Spotify de este navegador.
          if (user) spotifyAuthService.unlink(user.id)
          await logout()
        }}
      />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      {/* Pie fijo: MiniPlayer (si hay música) y, en móvil, BottomBar. */}
      <div className="sticky bottom-0 z-10">
        <MiniPlayer />
        <BottomBar items={BOTTOM_BAR_ITEMS} />
      </div>
    </div>
  )
}
