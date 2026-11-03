import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { RegisterRequest } from '../models/auth.types'
import {
  hasErrors,
  normalizeEmail,
  normalizeUsername,
  validateRegister,
  type FieldErrors,
  type RegisterFormValues,
} from '../models/auth.validation'
import { toUserMessage } from '../services/errorMessages'
import { useAuth } from './authContext'

const INITIAL_VALUES: RegisterFormValues = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  termsAccepted: false,
}

/** Convierte el formulario en el cuerpo de POST /auth/register (sin campos desconocidos). */
function toRegisterRequest(values: RegisterFormValues): RegisterRequest {
  const displayName = values.displayName.trim()
  return {
    username: normalizeUsername(values.username),
    email: normalizeEmail(values.email),
    password: values.password,
    // display_name es opcional: si está vacío no se envía (el backend lo guarda como NULL).
    ...(displayName !== '' && { display_name: displayName }),
  }
}

/**
 * Controlador de "Registrarse".
 * La aceptación de términos se valida solo en el cliente: el backend no tiene ese campo
 * (SOLICITUDES_BACKEND.md · AUTH-03). Mientras no se marque, el botón queda en estado Disabled de Figma.
 */
export function useRegisterController() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type, checked, value } = event.target
    const key = name as keyof RegisterFormValues
    setValues((current) => ({ ...current, [key]: type === 'checkbox' ? checked : value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !values.termsAccepted) return

    const errors = validateRegister(values)
    setFieldErrors(errors)
    setFormError(null)
    if (hasErrors(errors)) return

    setSubmitting(true)
    try {
      await register(toRegisterRequest(values))
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(toUserMessage(error))
      setSubmitting(false)
    }
  }

  return {
    values,
    fieldErrors,
    formError,
    submitting,
    canSubmit: values.termsAccepted,
    handleChange,
    handleSubmit,
  }
}
