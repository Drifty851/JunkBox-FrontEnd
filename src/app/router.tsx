import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '../features/auth/views/LoginPage'
import { RegisterPage } from '../features/auth/views/RegisterPage'
import { HomePage } from '../features/home/views/HomePage'
import { AppLayout } from './layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './routes/RouteGuards'

/**
 * Rutas de la aplicación. Cada módulo nuevo añade aquí sus pantallas.
 *  - /login, /register: módulo Autenticación (solo sin sesión).
 *  - Rutas con sesión: dentro de AppLayout (Navbar + BottomBar).
 *  - /: módulo Inicio.
 */
export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/', element: <HomePage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
