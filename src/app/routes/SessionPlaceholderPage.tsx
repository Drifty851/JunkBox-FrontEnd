import { useState } from 'react'
import { useAuth } from '../../features/auth/controllers/authContext'

/**
 * PÁGINA TEMPORAL. No sale de Figma.
 * Solo sirve como destino tras iniciar sesión o registrarse, para comprobar que la
 * sesión funciona (GET /auth/me) y poder cerrarla (POST /auth/logout).
 * Se sustituirá por el módulo "Inicio" (Figma · Desktop/Móvil · Inicio) cuando se implemente.
 */
export function SessionPlaceholderPage() {
  const { user, logout } = useAuth()
  const [leaving, setLeaving] = useState(false)

  async function handleLogout() {
    setLeaving(true)
    await logout()
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-sm leading-normal text-fg-muted">Sesión iniciada como</p>
      <p className="text-heading-sm font-bold text-fg">@{user?.username}</p>
      <button
        type="button"
        onClick={handleLogout}
        disabled={leaving}
        className="cursor-pointer text-sm font-semibold text-link underline disabled:cursor-progress"
      >
        Cerrar sesión
      </button>
    </main>
  )
}
