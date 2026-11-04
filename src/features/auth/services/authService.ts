import { ApiError } from '../../../shared/api/httpClient'
import { authApi } from '../infrastructure/authApi'
import { sessionStorageAdapter } from '../infrastructure/sessionStorage'
import type { RegisterRequest, StoredSession, UserProfile } from '../models/auth.types'

/** Renovación en curso. Se comparte para que varias peticiones con 401 no usen dos veces el mismo refresh token. */
let refreshInFlight: Promise<StoredSession> | null = null

/**
 * Renueva los tokens UNA sola vez aunque la pidan varias peticiones a la vez.
 * Si otra petición ya renovó (el token guardado no es el que falló), reutiliza el nuevo.
 * Reutilizar un refresh token revoca toda su familia en el backend, de ahí la deduplicación.
 */
function refreshSession(failedAccessToken: string): Promise<StoredSession> {
  const stored = sessionStorageAdapter.read()
  if (!stored) return Promise.reject(new ApiError(401, 'sesión no encontrada'))
  if (stored.accessToken !== failedAccessToken) return Promise.resolve(stored)

  refreshInFlight ??= authApi
    .refresh(stored.accessToken, { refresh_token: stored.refreshToken })
    .then((tokens) => sessionStorageAdapter.save(tokens))
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

/**
 * Casos de uso de autenticación: coordinan la API y el guardado de la sesión.
 * Flujo de tokens según el README del backend: access token JWT de 15 min y refresh token
 * de 7 días que rota en cada uso (reutilizarlo revoca toda la familia).
 */
export const authService = {
  /**
   * Ejecuta una llamada a un endpoint protegido con el access token guardado.
   * Ante un 401 renueva la sesión (una sola vez, compartida) y repite la llamada.
   * Si la renovación también da 401, borra la sesión y propaga el ApiError 401:
   * el controlador debe cerrar la sesión en la UI.
   */
  async withAccessToken<T>(call: (accessToken: string) => Promise<T>): Promise<T> {
    const stored = sessionStorageAdapter.read()
    if (!stored) throw new ApiError(401, 'sesión no encontrada')

    try {
      return await call(stored.accessToken)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
    }

    let renewed: StoredSession
    try {
      renewed = await refreshSession(stored.accessToken)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) sessionStorageAdapter.clear()
      throw error
    }
    return call(renewed.accessToken)
  },

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
      const renewed = await refreshSession(stored.accessToken)
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
