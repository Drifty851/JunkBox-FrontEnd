import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import type { Suggestion } from '../models/search.types'
import { searchService } from '../services/searchService'

/** Espera tras la última tecla antes de pedir sugerencias. */
const DEBOUNCE_MS = 300

export type SuggestionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; items: Suggestion[] }
  | { status: 'error' }

/**
 * Sugerencias del buscador de la Navbar para `text` (las 4 mejores coincidencias de cualquier
 * tipo). Espera DEBOUNCE_MS sin teclear y cancela la petición anterior. El estado se deriva de
 * la consulta a la que pertenece cada respuesta, sin setState síncrono en efectos.
 */
export function useSearchSuggestions(text: string): SuggestionsState {
  const { logout } = useAuth()
  const query = text.trim()
  const [response, setResponse] = useState<{ query: string; items: Suggestion[] | null } | null>(null)

  useEffect(() => {
    if (query === '') return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchService
        .suggest(query, controller.signal)
        .then((items) => setResponse({ query, items }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          if (error instanceof ApiError && error.status === 401) {
            void logout()
            return
          }
          setResponse({ query, items: null })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, logout])

  if (query === '') return { status: 'idle' }
  if (response?.query !== query) return { status: 'loading' }
  return response.items === null ? { status: 'error' } : { status: 'ready', items: response.items }
}
