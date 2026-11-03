import { ApiError } from '../../../shared/api/httpClient'
import { authApi } from '../infrastructure/authApi'
import { sessionStorageAdapter } from '../infrastructure/sessionStorage'
import type { RegisterRequest, UserProfile } from '../models/auth.types'

/**
 * Casos de uso de autenticación: coordinan la API y el guardado de la sesión.
 * Flujo de tokens según el README del backend: access token JWT de 15 min y refresh token
 * de 7 días que rota en cada uso (reutilizarlo revoca toda la familia).
 */
export const authService = {
  async login(identifier: string, password: string): Promise<UserProfile> {
    const response = await authApi.login({ identifier: identifier.trim(), password })
    sessionStorageAdapter.save(response)
    return response.user
  },

  async register(input: RegisterRequest): Promise<UserProfile> {
    const response = await authApi.register(input)
    sessionStorageAdapter.save(response)
    return response.user
  },

  /**
   * Recupera la sesión guardada al abrir la app:
   * 1. GET /auth/me con el access token.
   * 2. Si responde 401, intenta POST /auth/refresh (con el access token anterior) y repite /me.
   * 3. Si algo falla con 401, borra la sesión. Los errores de red se propagan sin borrar nada.
   */
  async restoreSession(): Promise<UserProfile | null> {
    const stored = sessionStorageAdapter.read()
    if (!stored) return null

    try {
      return await authApi.me(stored.accessToken)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
    }

    try {
      const tokens = await authApi.refresh(stored.accessToken, { refresh_token: stored.refreshToken })
      const renewed = sessionStorageAdapter.save(tokens)
      return await authApi.me(renewed.accessToken)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionStorageAdapter.clear()
        return null
      }
      throw error
    }
  },

  /** POST /auth/logout es idempotente. La sesión local se borra aunque la llamada falle. */
  async logout(): Promise<void> {
    const stored = sessionStorageAdapter.read()
    sessionStorageAdapter.clear()
    if (!stored) return
    try {
      await authApi.logout(stored.accessToken, { refresh_token: stored.refreshToken })
    } catch {
      // Sin red o con el token ya expirado, el cierre local es suficiente.
    }
  },
}
