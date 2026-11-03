import { utf8ByteLength } from '../../../shared/utils/byteLength'

/**
 * Validación en el cliente que REPLICA las reglas que ya aplica el backend
 * (internal/core/services/auth_service.go · validateRegister y handlers_auth.go).
 * No añade reglas nuevas: solo adelanta los errores que el servidor devolvería con 400.
 * El servidor sigue siendo la fuente de verdad.
 */

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,50}$/
export const PASSWORD_MIN_BYTES = 8
export const PASSWORD_MAX_BYTES = 72
export const EMAIL_MAX_LENGTH = 255
export const DISPLAY_NAME_MAX_LENGTH = 100

export interface LoginFormValues {
  identifier: string
  password: string
}

export interface RegisterFormValues {
  displayName: string
  username: string
  email: string
  password: string
  termsAccepted: boolean
}

export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>

/** El backend recorta espacios y pasa username y email a minúsculas antes de validar. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** Comprobación básica de formato. El backend valida con net/mail y es quien decide. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(value)
}

/** POST /auth/login: "identifier y password son requeridos". */
export function validateLogin(values: LoginFormValues): FieldErrors<LoginFormValues> {
  const errors: FieldErrors<LoginFormValues> = {}
  if (values.identifier.trim() === '') errors.identifier = 'Introduce tu correo electrónico.'
  if (values.password === '') errors.password = 'Introduce tu contraseña.'
  return errors
}

/** POST /auth/register: mismas reglas y mismo orden que validateRegister del backend. */
export function validateRegister(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = {}

  if ([...values.displayName.trim()].length > DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = `No puede superar ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
  }

  if (!USERNAME_PATTERN.test(normalizeUsername(values.username))) {
    errors.username = "De 3 a 50 caracteres: letras, números, '_' o '.'."
  }

  const email = normalizeEmail(values.email)
  if (email === '' || email.length > EMAIL_MAX_LENGTH || !looksLikeEmail(email)) {
    errors.email = 'Introduce un correo electrónico válido.'
  }

  const passwordBytes = utf8ByteLength(values.password)
  if (passwordBytes < PASSWORD_MIN_BYTES || passwordBytes > PASSWORD_MAX_BYTES) {
    errors.password = `Debe tener entre ${PASSWORD_MIN_BYTES} y ${PASSWORD_MAX_BYTES} bytes.`
  }

  return errors
}

export function hasErrors<TValues>(errors: FieldErrors<TValues>): boolean {
  return Object.values(errors).some(Boolean)
}
