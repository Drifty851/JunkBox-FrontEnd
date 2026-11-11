import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'

export type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string; notFound: boolean }

type Outcome<T> = { key: string; data: T } | { key: string; message: string; notFound: boolean }

/**
 * Carga asíncrona por clave para las fichas: una petición por `key` (o reintento), cancelando
 * la anterior. `key = null` = aún no hay qué cargar (idle). El estado se deriva de la clave de
 * la última respuesta, sin setState síncrono en el efecto. Un 401 cierra la sesión.
 * `loader` debe ser estable (una función de módulo): solo `key` dispara la carga.
 */
export function useLoad<T>(
  key: string | null,
  loader: (key: string, signal: AbortSignal) => Promise<T>,
): [LoadState<T>, () => void] {
  const { logout } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null)
  const fullKey = key === null ? null : `${attempt}:${key}`

  useEffect(() => {
    if (key === null || fullKey === null) return
    const controller = new AbortController()
    loader(key, controller.signal)
      .then((data) => setOutcome({ key: fullKey, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          void logout()
          return
        }
        setOutcome({
          key: fullKey,
          message: toUserMessage(error),
          notFound: error instanceof ApiError && (error.status === 404 || error.status === 400),
        })
      })
    return () => controller.abort()
  }, [key, fullKey, loader, logout])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  let state: LoadState<T>
  if (fullKey === null) state = { status: 'idle' }
  else if (outcome?.key !== fullKey) state = { status: 'loading' }
  else if ('data' in outcome) state = { status: 'ready', data: outcome.data }
  else state = { status: 'error', message: outcome.message, notFound: outcome.notFound }

  return [state, retry]
}
