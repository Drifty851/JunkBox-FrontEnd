import { ApiError, NetworkError } from '../../../shared/api/httpClient'

/**
 * Convierte un error de la API en el texto que se muestra al usuario.
 * Por defecto se usa el mensaje del backend, que ya responde en español
 * ({"error": "credenciales inválidas"}, etc.; ver handlers_auth.go · writeServiceError),
 * ajustando solo la presentación (mayúscula inicial y punto final).
 */

/** Texto propio del 401 de /auth/login; sustituye al "credenciales inválidas" del backend. */
const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos.'

export function toUserMessage(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) return sentenceCase(error.message)
  return 'Ha ocurrido un error inesperado.'
}

/**
 * Error del formulario de inicio de sesión.
 * El backend responde 401 "credenciales inválidas" tanto si el identificador no existe
 * como si la contraseña no coincide, así que se muestra un único mensaje que no revela cuál falló.
 */
export function toLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return INVALID_CREDENTIALS_MESSAGE
  return toUserMessage(error)
}

function sentenceCase(message: string): string {
  const text = message.trim()
  if (text === '') return 'Error interno.'
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}
