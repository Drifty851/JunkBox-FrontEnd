import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../services/authService'
import { toUserMessage } from '../services/errorMessages'
import { useEmailLinkToken } from './useEmailLinkToken'

export type VerifyEmailState =
  | { status: 'verifying' }
  | { status: 'verified'; message: string }
  /** Sin token, ya usado o caducado (401). */
  | { status: 'invalid' }
  /** Red o error del servidor: el token no se consumió y se puede reintentar. */
  | { status: 'error'; message: string }

/**
 * Controlador de "Verificar correo" (POST /auth/email/verify con el token del enlace).
 * Verifica al abrir la página, una sola vez: el token es de un solo uso y React (StrictMode)
 * ejecuta los efectos dos veces en desarrollo, así que la llamada se protege con una referencia.
 */
export function useVerifyEmailController() {
  const token = useEmailLinkToken()
  const [state, setState] = useState<VerifyEmailState>(token === null ? { status: 'invalid' } : { status: 'verifying' })
  const [attempt, setAttempt] = useState(0)
  const startedAttempt = useRef<number | null>(null)

  useEffect(() => {
    if (token === null || startedAttempt.current === attempt) return
    startedAttempt.current = attempt
    // Sin cancelación en la limpieza: en StrictMode la limpieza llega antes de la respuesta y,
    // como el segundo efecto no repite la llamada, se perdería el único resultado.
    authService
      .verifyEmail(token)
      .then((message) => setState({ status: 'verified', message }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) setState({ status: 'invalid' })
        else setState({ status: 'error', message: toUserMessage(error) })
      })
  }, [token, attempt])

  const retry = useCallback(() => {
    setState({ status: 'verifying' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}
