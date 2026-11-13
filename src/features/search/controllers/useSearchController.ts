import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../../../shared/api/httpClient'
import { useAuth } from '../../auth/controllers/authContext'
import { toUserMessage } from '../../auth/services/errorMessages'
import type { AlbumRating, SearchResults } from '../models/search.types'
import { searchService } from '../services/searchService'

/**
 * Espera tras la última tecla antes de buscar. 250 ms (antes 400): con datos ya guardados el
 * backend responde en 10–90 ms, así que la espera era casi todo el tiempo de carga.
 */
const DEBOUNCE_MS = 250
/** Límite del backend para `q`. */
export const MAX_QUERY_LENGTH = 200

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'ready'; results: SearchResults }
  | { status: 'error'; query: string; message: string }

/** Resultado de una búsqueda, con la clave `${intento}:${consulta}` que lo produjo. */
type Outcome = { key: string; results: SearchResults } | { key: string; message: string }

export interface SearchController {
  input: string
  state: SearchState
  /** Calificación del álbum destacado (tarjeta de escritorio); `null` mientras no se conoce. */
  featuredRating: AlbumRating | null
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void
  /** Enter: busca sin esperar al debounce. */
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  clear: () => void
  retry: () => void
}

/**
 * Controlador del Buscador. La consulta vive en la URL (`?q=`): escribir la actualiza tras
 * DEBOUNCE_MS (sin crear entradas de historial) y cada cambio de `q` lanza la búsqueda,
 * cancelando la anterior. Un 401 cierra la sesión, como en Inicio.
 */
export function useSearchController(): SearchController {
  const { logout } = useAuth()
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const [input, setInput] = useState(query)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [featured, setFeatured] = useState<{ albumId: string; rating: AlbumRating } | null>(null)
  const [attempt, setAttempt] = useState(0)
  /** Última consulta que escribió este controlador en la URL. */
  const committed = useRef(query)

  const commit = useCallback(
    (value: string) => {
      const next = value.trim().slice(0, MAX_QUERY_LENGTH)
      committed.current = next
      setParams(next === '' ? {} : { q: next }, { replace: true })
    },
    [setParams],
  )

  // La URL cambió desde fuera (atrás/adelante, enlace del Navbar): el campo la sigue.
  useEffect(() => {
    if (query === committed.current) return
    committed.current = query
    setInput(query)
  }, [query])

  // Debounce: lo escrito pasa a la URL al dejar de teclear.
  useEffect(() => {
    if (input.trim() === query) return
    const timer = setTimeout(() => commit(input), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, query, commit])

  // Búsqueda: una por cada `q` (o reintento); la anterior se cancela. El resultado se guarda
  // con su clave y el estado se deriva en el render (sin setState síncrono en el efecto).
  const key = `${attempt}:${query}`
  useEffect(() => {
    if (query === '') return
    const controller = new AbortController()
    searchService
      .search(query, controller.signal)
      .then((results) => {
        setOutcome({ key, results })
        const featured = results.albums[0]
        if (featured) {
          searchService
            .getAlbumRating(featured.id, controller.signal)
            .then((rating) => setFeatured({ albumId: featured.id, rating }))
            .catch(() => undefined)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          void logout()
          return
        }
        setOutcome({ key, message: toUserMessage(error) })
      })
    return () => controller.abort()
  }, [key, query, logout])

  let state: SearchState
  if (query === '') state = { status: 'idle' }
  else if (outcome?.key !== key) state = { status: 'loading', query }
  else if ('results' in outcome) state = { status: 'ready', results: outcome.results }
  else state = { status: 'error', query, message: outcome.message }

  const featuredAlbumId = state.status === 'ready' ? state.results.albums[0]?.id : undefined
  const featuredRating = featured !== null && featured.albumId === featuredAlbumId ? featured.rating : null

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setInput(event.target.value), [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      commit(input)
    },
    [commit, input],
  )

  const clear = useCallback(() => {
    setInput('')
    commit('')
  }, [commit])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { input, state, featuredRating, handleChange, handleSubmit, clear, retry }
}
