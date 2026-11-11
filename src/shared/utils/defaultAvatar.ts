/**
 * Avatar robot por defecto (DiceBear "bottts", el mismo estilo que los usuarios seed del backend).
 * La semilla es el username: cada cuenta tiene siempre el mismo robot.
 * Decisión del propietario (2026-11-06). Pendiente en el backend: USER-03 (SOLICITUDES_BACKEND.md).
 */
const DICEBEAR_BOTTTS_URL = 'https://api.dicebear.com/7.x/bottts/svg'

export function defaultAvatarUrl(seed: string): string {
  return `${DICEBEAR_BOTTTS_URL}?seed=${encodeURIComponent(seed)}`
}
