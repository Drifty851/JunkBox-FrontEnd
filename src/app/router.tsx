import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '../features/auth/views/LoginPage'
import { RegisterPage } from '../features/auth/views/RegisterPage'
import { ProtectedRoute, PublicOnlyRoute } from './routes/RouteGuards'
import { SessionPlaceholderPage } from './routes/SessionPlaceholderPage'

/**
 * Rutas de la aplicación. Cada módulo nuevo añade aquí sus pantallas.
 *  - /login, /register: módulo Autenticación (solo sin sesión).
 *  - /: destino temporal tras autenticarse (hasta que exista el módulo Inicio).
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
    children: [{ path: '/', element: <SessionPlaceholderPage /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
