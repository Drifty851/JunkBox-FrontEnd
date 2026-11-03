import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RegisterRequest, UserProfile } from '../models/auth.types'
import { authService } from '../services/authService'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

/** Mantiene la sesión del usuario y la recupera al iniciar la aplicación. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    authService
      .restoreSession()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        setStatus(profile ? 'authenticated' : 'anonymous')
      })
      .catch(() => {
        // Backend no disponible: se continúa como anónimo sin borrar los tokens guardados.
        if (!cancelled) setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const profile = await authService.login(identifier, password)
    setUser(profile)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterRequest) => {
    const profile = await authService.register(input)
    setUser(profile)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
