import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import {
  hasErrors,
  validateResetPassword,
  type FieldErrors,
  type ResetPasswordFormValues,
} from '../models/auth.validation'
import { authService } from '../services/authService'
import { toUserMessage } from '../services/errorMessages'
import { useAuth } from './authContext'
import { useEmailLinkToken } from './useEmailLinkToken'

const INITIAL_VALUES: ResetPasswordFormValues = { password: '', confirmPassword: '' }

/** form: pidiendo la contraseña · done: cambiada · invalid: enlace sin token, usado o caducado (401). */
export type ResetPasswordStatus = 'form' | 'done' | 'invalid'

/**
 * Controlador de "Restablecer contraseña" (POST /auth/password/reset con el token del enlace).
 * - 400: la contraseña no cumple la regla; se muestra bajo el campo y el token sigue valiendo.
 * - 401: el enlace ya no sirve.
 * - Éxito: el backend cerró todas las sesiones; también se cierra la de este navegador.
 */
export function useResetPasswordController() {
  const token = useEmailLinkToken()
  const { logout } = useAuth()
  const [status, setStatus] = useState<ResetPasswordStatus>(token === null ? 'invalid' : 'form')
  const [values, setValues] = useState<ResetPasswordFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ResetPasswordFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as keyof ResetPasswordFormValues
    setValues((current) => ({ ...current, [name]: event.target.value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || token === null) return

    const errors = validateResetPassword(values)
    setFieldErrors(errors)
    setFormError(null)
    if (hasErrors(errors)) return

    setSubmitting(true)
    try {
      setDoneMessage(await authService.resetPassword(token, values.password))
      setStatus('done')
      // La sesión local ya se borró en el servicio; esto pone la app en estado anónimo.
      await logout()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus('invalid')
      } else if (error instanceof ApiError && error.status === 400) {
        setFieldErrors({ password: toUserMessage(error) })
      } else {
        setFormError(toUserMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { status, values, fieldErrors, formError, submitting, doneMessage, handleChange, handleSubmit }
}
