import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import type { RecommendedTrack } from '../models/home.types'
import { homeService } from '../services/homeService'

export type RecommendationsState =
  | { status: 'loading' }
  | { status: 'ready'; tracks: RecommendedTrack[] }
  | { status: 'error'; message: string }

export interface HomeController {
  recommendations: RecommendationsState
  /** Vuelve a pedir las recomendaciones (botón "Reintentar" del estado de error). */
  retry: () => void
}

/**
 * Controlador de Inicio: carga "Hecho para tus oídos" y gestiona carga, error y reintento.
 * Si la sesión caducó sin poder renovarse (401), cierra la sesión: las guardas de ruta
 * llevan entonces a /login.
 */
export function useHomeController(): HomeController {
  const { logout } = useAuth()
  const [recommendations, setRecommendations] = useState<RecommendationsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    homeService
      .getRecommendations(controller.signal)
      .then((tracks) => setRecommendations({ status: 'ready', tracks }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          void logout()
          return
        }
        setRecommendations({ status: 'error', message: toUserMessage(error) })
      })
    return () => controller.abort()
  }, [attempt, logout])

  const retry = useCallback(() => {
    setRecommendations({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { recommendations, retry }
}
