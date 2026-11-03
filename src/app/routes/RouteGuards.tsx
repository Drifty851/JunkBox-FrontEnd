import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/controllers/authContext'

/** Mientras se recupera la sesión guardada no se muestra nada, para evitar parpadeos. */
function SessionCheck() {
  return <div className="min-h-dvh bg-bg" aria-busy="true" />
}

/** Rutas solo para usuarios sin sesión (login, registro). Con sesión, redirige a "/". */
export function PublicOnlyRoute() {
  const { status } = useAuth()
  if (status === 'checking') return <SessionCheck />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}

/** Rutas que requieren sesión. Sin sesión, redirige a "/login". */
export function ProtectedRoute() {
  const { status } = useAuth()
  if (status === 'checking') return <SessionCheck />
  if (status === 'anonymous') return <Navigate to="/login" replace />
  return <Outlet />
}
