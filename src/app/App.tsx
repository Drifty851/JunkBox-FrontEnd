import { RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/controllers/AuthProvider'
import { router } from './router'

/** Raíz de la aplicación: proveedores globales + enrutado. */
export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
