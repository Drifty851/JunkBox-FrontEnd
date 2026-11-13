import { useState, type ChangeEvent } from 'react'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import { authService } from '../../auth/services/authService'
import type { UserProfile } from '../../auth/models/auth.types'
import { validateProfile, type ProfileFormValues } from '../models/settings'

export type PasswordResetState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; message: string }
  | { status: 'error'; message: string }

function initialValues(user: UserProfile | null): ProfileFormValues {
  return { displayName: user?.display_name ?? '', username: user?.username ?? '', email: user?.email ?? '' }
}

/**
 * Controlador de Configuración.
 *  - Información pública: se edita y valida en el cliente, pero no se puede guardar: el backend
 *    no tiene endpoint para actualizar el usuario (USER-01). Los errores solo se muestran en los
 *    campos que el usuario cambió.
 *  - Contraseña: no hay cambio con sesión iniciada (USER-02); "Cambiar contraseña" envía el enlace
 *    de recuperación al correo del usuario (POST /auth/password/forgot), alternativa aprobada.
 */
export function useSettingsController() {
  const { user, logout } = useAuth()
  const [values, setValues] = useState<ProfileFormValues>(() => initialValues(user))
  const [passwordReset, setPasswordReset] = useState<PasswordResetState>({ status: 'idle' })

  const original = initialValues(user)
  const allErrors = validateProfile(values)
  const fieldErrors: typeof allErrors = {}
  for (const key of Object.keys(allErrors) as (keyof ProfileFormValues)[]) {
    if (values[key] !== original[key]) fieldErrors[key] = allErrors[key]
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function requestPasswordReset() {
    if (!user || passwordReset.status === 'sending') return
    setPasswordReset({ status: 'sending' })
    try {
      const message = await authService.forgotPassword(user.email)
      setPasswordReset({ status: 'sent', message })
    } catch (error) {
      setPasswordReset({ status: 'error', message: toUserMessage(error) })
    }
  }

  return {
    user,
    values,
    fieldErrors,
    handleChange,
    /** USER-01: sin endpoint para guardar el perfil. */
    canSave: false,
    passwordReset,
    requestPasswordReset,
    logout,
  }
}
