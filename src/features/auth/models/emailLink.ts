/**
 * Enlaces de los correos de cuenta (backend · account_email_service.go):
 *   {FRONTEND_URL}/restablecer-contrasena#token=…   (recuperación, 30 min)
 *   {FRONTEND_URL}/verificar-correo#token=…          (verificación, 24 h)
 * El token va en el fragmento (#), que el navegador no envía a ningún servidor.
 */
export const RESET_PASSWORD_PATH = '/restablecer-contrasena'
export const VERIFY_EMAIL_PATH = '/verificar-correo'
export const FORGOT_PASSWORD_PATH = '/recuperar-contrasena'

/** Lee el token del fragmento de la URL (`#token=…`). Devuelve null si falta o está vacío. */
export function readEmailLinkToken(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token')
  return token !== null && token.trim() !== '' ? token : null
}
