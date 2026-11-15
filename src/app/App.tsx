import { RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/controllers/AuthProvider'
import { PlayerProvider } from '../features/player/controllers/PlayerProvider'
import { router } from './router'

/**
 * Raíz de la aplicación: proveedores globales + enrutado.
 * PlayerProvider va aquí y no en AppLayout: Inicio (`/`) y el resto de pantallas usan instancias
 * distintas de AppLayout, y la música se cortaba al pasar de una a otra (2026-11-13). Sin sesión
 * queda inactivo; el MiniPlayer se dibuja en AppLayout.
 */
export function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </AuthProvider>
  )
}
