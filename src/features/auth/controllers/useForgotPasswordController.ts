import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  hasErrors,
  validateForgotPassword,
  type FieldErrors,
  type ForgotPasswordFormValues,
} from '../models/auth.validation'
import { authService } from '../services/authService'
import { toUserMessage } from '../services/errorMessages'

const INITIAL_VALUES: ForgotPasswordFormValues = { email: '' }

/**
 * Controlador de "Recuperar contraseña" (POST /auth/password/forgot).
 * El backend responde siempre lo mismo, exista o no la cuenta: ese mensaje sustituye al formulario.
 */
export function useForgotPasswordController() {
  const [values, setValues] = useState<ForgotPasswordFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ForgotPasswordFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  /** Se pulsó "Reenviar enlace" y el backend respondió: se confirma en pantalla. */
  const [resent, setResent] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as keyof ForgotPasswordFormValues
    setValues((current) => ({ ...current, [name]: event.target.value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function send(): Promise<boolean> {
    setSubmitting(true)
    setFormError(null)
    try {
      setSentMessage(await authService.forgotPassword(values.email))
      return true
    } catch (error) {
      setFormError(toUserMessage(error))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const errors = validateForgotPassword(values)
    setFieldErrors(errors)
    setFormError(null)
    if (hasErrors(errors)) return
    await send()
  }

  /** "¿No te llegó? Reenviar enlace": repite la petición con el mismo correo. */
  async function resend() {
    if (submitting) return
    setResent(false)
    if (await send()) setResent(true)
  }

  return { values, fieldErrors, formError, submitting, sentMessage, resent, handleChange, handleSubmit, resend }
}
