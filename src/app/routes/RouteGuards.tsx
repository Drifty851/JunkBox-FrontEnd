import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/controllers/authContext'
import { LandingPage } from '../../features/landing/views/LandingPage'
import { AppLayout } from '../layout/AppLayout'

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

/** Rutas que requieren sesión. Sin sesión, redirige a "/" (la landing). */
export function ProtectedRoute() {
  const { status } = useAuth()
  if (status === 'checking') return <SessionCheck />
  if (status === 'anonymous') return <Navigate to="/" replace />
  return <Outlet />
}

/**
 * "/" según la sesión (decisión del propietario, 2026-11-11): sin sesión, la landing; con sesión,
 * la estructura común (AppLayout) con Inicio como ruta índice.
 */
export function HomeRoute() {
  const { status } = useAuth()
  if (status === 'checking') return <SessionCheck />
  if (status === 'anonymous') return <LandingPage />
  return <AppLayout />
}
