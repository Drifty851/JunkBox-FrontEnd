import { ApiError, NetworkError } from '../../../shared/api/httpClient'

/**
 * Convierte un error de la API en el texto que se muestra al usuario.
 * El backend ya responde en español ({"error": "credenciales inválidas"}, etc.;
 * ver handlers_auth.go · writeServiceError), así que solo se ajusta la presentación
 * (mayúscula inicial y punto final). No se inventan mensajes nuevos por código de estado.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) return sentenceCase(error.message)
  return 'Ha ocurrido un error inesperado.'
}

function sentenceCase(message: string): string {
  const text = message.trim()
  if (text === '') return 'Error interno.'
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}
