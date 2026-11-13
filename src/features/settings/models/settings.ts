import {
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  normalizeEmail,
  normalizeUsername,
  type FieldErrors,
} from '../../auth/models/auth.validation'

/** Ruta de Configuración (menú del avatar). */
export const SETTINGS_PATH = '/configuracion'

/** Campos de "Información pública" (Figma · ProfileField). Sin "Bio musical" (decisión del propietario). */
export interface ProfileFormValues {
  displayName: string
  username: string
  email: string
}

/** Opciones de "Frecuencia de recomendaciones" (Figma · FrequencyOption). Sin backend: PREF-01. */
export type RecommendationFrequency = 'weekly' | 'every_3_days' | 'daily' | 'never'

export const FREQUENCY_OPTIONS: readonly { value: RecommendationFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal [Por defecto]' },
  { value: 'every_3_days', label: 'Cada 3 días' },
  { value: 'daily', label: 'Diario' },
  { value: 'never', label: 'Nunca' },
]

export const DEFAULT_FREQUENCY: RecommendationFrequency = 'weekly'

/**
 * Mismas reglas que el registro (auth.validation.ts, que replica al backend). El nombre visible
 * puede repetirse entre usuarios (decisión del propietario); el username, no (lo comprobará el
 * backend con 409 cuando exista USER-01).
 */
export function validateProfile(values: ProfileFormValues): FieldErrors<ProfileFormValues> {
  const errors: FieldErrors<ProfileFormValues> = {}
  if ([...values.displayName.trim()].length > DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = `No puede superar ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
  }
  if (!USERNAME_PATTERN.test(normalizeUsername(values.username))) {
    errors.username = "De 3 a 50 caracteres: letras, números, '_' o '.'."
  }
  const email = normalizeEmail(values.email)
  if (email === '' || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Introduce un correo electrónico válido.'
  }
  return errors
}
