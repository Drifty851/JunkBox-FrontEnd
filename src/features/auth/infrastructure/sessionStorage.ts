import type { StoredSession, TokenPair } from '../models/auth.types'

const STORAGE_KEY = 'junkbox.session'

/**
 * Guardado de tokens en localStorage.
 * Riesgo conocido: un script inyectado (XSS) podría leerlos. Se acepta en esta fase
 * porque el backend entrega los tokens en el cuerpo JSON (no usa cookies httpOnly).
 * Ver implementacion.md · Módulo Autenticación · Limitaciones conocidas.
 */
export const sessionStorageAdapter = {
  read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as StoredSession).accessToken === 'string' &&
        typeof (parsed as StoredSession).refreshToken === 'string' &&
        typeof (parsed as StoredSession).accessTokenExpiresAt === 'number'
      ) {
        return parsed as StoredSession
      }
      return null
    } catch {
      return null
    }
  },

  save(tokens: TokenPair): StoredSession {
    const session: StoredSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Si el almacenamiento no está disponible (modo privado), la sesión vive solo en memoria.
    }
    return session
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Sin almacenamiento disponible no hay nada que borrar.
    }
  },
}
