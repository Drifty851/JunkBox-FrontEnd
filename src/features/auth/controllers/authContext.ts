import { createContext, useContext } from 'react'
import type { RegisterRequest, UserProfile } from '../models/auth.types'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: UserProfile | null
  login: (identifier: string, password: string) => Promise<void>
  register: (input: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Acceso al estado de sesión. Debe usarse dentro de <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return value
}
