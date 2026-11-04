import { utf8ByteLength } from '../../../shared/utils/byteLength'

/**
 * Validación en el cliente que REPLICA las reglas que ya aplica el backend
 * (internal/core/services/auth_service.go · validateRegister y handlers_auth.go).
 * Solo adelanta los errores que el servidor devolvería con 400, con una excepción
 * deliberada: el formato de correo es más estricto que `net/mail` (ver EMAIL_PATTERN
 * y SOLICITUDES_BACKEND.md · AUTH-06). El servidor sigue siendo la fuente de verdad.
 */

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,50}$/
/**
 * Formato de correo exigido por el formulario de registro.
 * Es MÁS ESTRICTO que `net/mail` del backend, que acepta dominios sin punto
 * ("usuario@dominio") y permitiría crear cuentas con correos inexistentes.
 * Se exige al menos un punto en el dominio y un TLD de 2 o más letras.
 * Pendiente de que el backend aplique la misma regla (SOLICITUDES_BACKEND.md · AUTH-06).
 */
export const EMAIL_PATTERN = /^[^\s@]+@([^\s@.]+\.)+[A-Za-z]{2,}$/
/** Mínimo en caracteres (runas Unicode, igual que `utf8.RuneCountInString` del backend). */
export const PASSWORD_MIN_CHARS = 8
/** Máximo en bytes UTF-8: bcrypt ignora lo que pasa de 72 bytes. */
export const PASSWORD_MAX_BYTES = 72
/**
 * Equivalentes de `unicode.IsLetter`, `unicode.IsDigit` e `IsPunct || IsSymbol`
 * de `validatePassword` (auth_service.go).
 */
const PASSWORD_LETTER = /\p{L}/u
const PASSWORD_DIGIT = /\p{Nd}/u
const PASSWORD_SPECIAL = /[\p{P}\p{S}]/u
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

/** Comprobación de formato: exige dominio con punto y TLD de 2+ letras. */
function looksLikeEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
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

  const passwordError = validatePassword(values.password)
  if (passwordError) errors.password = passwordError

  return errors
}

/** Mismas comprobaciones y mismo orden que `validatePassword` del backend. */
function validatePassword(password: string): string | undefined {
  if ([...password].length < PASSWORD_MIN_CHARS) {
    return `Debe tener al menos ${PASSWORD_MIN_CHARS} caracteres.`
  }
  if (utf8ByteLength(password) > PASSWORD_MAX_BYTES) {
    return `No puede superar ${PASSWORD_MAX_BYTES} bytes. Algunos caracteres ocupan más de un byte.`
  }
  if (
    !PASSWORD_LETTER.test(password) ||
    !PASSWORD_DIGIT.test(password) ||
    !PASSWORD_SPECIAL.test(password)
  ) {
    return 'Debe incluir letras, números y caracteres especiales.'
  }
  return undefined
}

export function hasErrors<TValues>(errors: FieldErrors<TValues>): boolean {
  return Object.values(errors).some(Boolean)
}
