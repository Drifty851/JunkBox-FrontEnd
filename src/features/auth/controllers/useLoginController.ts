import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { hasErrors, validateLogin, type FieldErrors, type LoginFormValues } from '../models/auth.validation'
import { toUserMessage } from '../services/errorMessages'
import { useAuth } from './authContext'

const INITIAL_VALUES: LoginFormValues = { identifier: '', password: '' }

/** Controlador de "Iniciar sesión": estado del formulario, validación, envío y errores. */
export function useLoginController() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as keyof LoginFormValues
    setValues((current) => ({ ...current, [name]: event.target.value }))
    // Se quita el error del campo en cuanto el usuario lo corrige.
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const errors = validateLogin(values)
    setFieldErrors(errors)
    setFormError(null)
    if (hasErrors(errors)) return

    setSubmitting(true)
    try {
      await login(values.identifier, values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(toUserMessage(error))
      setSubmitting(false)
    }
  }

  return { values, fieldErrors, formError, submitting, handleChange, handleSubmit }
}
