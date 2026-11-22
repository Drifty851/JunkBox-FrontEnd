import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/httpClient'

/** Una página de una lista paginada con cursor. `nextCursor` null = última página. */
export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
}

export type CursorListState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      items: T[]
      hasMore: boolean
      /** Se está pidiendo la siguiente página. */
      loadingMore: boolean
      /** Falló la siguiente página: lo ya cargado se mantiene. */
      moreError: string | null
    }

interface ListData<T> {
  key: string
  items: T[]
  nextCursor: string | null
  loadingMore: boolean
  moreError: string | null
}

type Outcome<T> = ListData<T> | { key: string; message: string }

interface CursorListOptions<T> {
  /** Pide una página (sin cursor, la primera). */
  loadPage: (cursor: string | null, signal: AbortSignal) => Promise<CursorPage<T>>
  /** Identificador de cada elemento, para no repetirlos entre páginas. */
  getId: (item: T) => string
  /** Convierte un error en el texto que se muestra; null = no mostrar nada (p. ej. 401, que cierra la sesión). */
  toMessage: (error: unknown) => string | null
}

export interface CursorListController<T> {
  state: CursorListState<T>
  /** Pide la siguiente página (scroll infinito o "Reintentar" tras un fallo). */
  loadMore: () => void
  /** Vuelve a pedir la primera página. */
  retry: () => void
}

function appendUnique<T>(current: T[], next: T[], getId: (item: T) => string): T[] {
  const seen = new Set(current.map(getId))
  return [...current, ...next.filter((item) => !seen.has(getId(item)))]
}

/**
 * Lista paginada con cursor (feed de Inicio, seguidores y seguidos, después comentarios). Cambiar
 * `key` o reintentar empieza desde la primera página; el estado se deriva de `key:intento`, sin
 * `setState` síncrono en el efecto. Las páginas nuevas se añaden sin repetir elementos. Se usa con
 * `useInfiniteScroll` (decisión del propietario, 2026-11-19: un solo hook para todas las listas).
 * `loadPage` puede cambiar en cada render: solo `key` dispara la carga.
 */
export function useCursorList<T>(key: string, { loadPage, getId, toMessage }: CursorListOptions<T>): CursorListController<T> {
  const [attempt, setAttempt] = useState(0)
  const fullKey = `${key}:${attempt}`
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null)
  const current = useRef<Outcome<T> | null>(null)
  const moreController = useRef<AbortController | null>(null)
  const options = useRef({ loadPage, getId, toMessage })

  useEffect(() => {
    options.current = { loadPage, getId, toMessage }
  }, [loadPage, getId, toMessage])

  useEffect(() => {
    current.current = outcome
  }, [outcome])

  useEffect(() => {
    const controller = new AbortController()
    options.current
      .loadPage(null, controller.signal)
      .then((page) => setOutcome({ key: fullKey, items: page.items, nextCursor: page.nextCursor, loadingMore: false, moreError: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = options.current.toMessage(error)
        if (message !== null) setOutcome({ key: fullKey, message })
      })
    return () => {
      controller.abort()
      moreController.current?.abort()
    }
  }, [fullKey])

  const loadMore = useCallback(() => {
    const data = current.current
    if (!data || data.key !== fullKey || !('items' in data) || !data.nextCursor || data.loadingMore) return
    const cursor = data.nextCursor
    const controller = new AbortController()
    moreController.current = controller
    const loading: ListData<T> = { ...data, loadingMore: true, moreError: null }
    current.current = loading
    setOutcome(loading)
    options.current
      .loadPage(cursor, controller.signal)
      .then((page) =>
        setOutcome((previous) =>
          previous && previous.key === fullKey && 'items' in previous
            ? {
                ...previous,
                items: appendUnique(previous.items, page.items, options.current.getId),
                nextCursor: page.nextCursor,
                loadingMore: false,
              }
            : previous,
        ),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = options.current.toMessage(error)
        if (message === null) return
        setOutcome((previous) =>
          previous && previous.key === fullKey && 'items' in previous ? { ...previous, loadingMore: false, moreError: message } : previous,
        )
      })
  }, [fullKey])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  let state: CursorListState<T> = { status: 'loading' }
  if (outcome?.key === fullKey) {
    state =
      'items' in outcome
        ? { status: 'ready', items: outcome.items, hasMore: outcome.nextCursor !== null, loadingMore: outcome.loadingMore, moreError: outcome.moreError }
        : { status: 'error', message: outcome.message }
  }

  return { state, loadMore, retry }
}

/** `toMessage` habitual: un 401 cierra la sesión sin mensaje; el resto, el texto del error. */
export function cursorErrorMessage(logout: () => Promise<void>, toUserMessage: (error: unknown) => string) {
  return (error: unknown): string | null => {
    if (error instanceof ApiError && error.status === 401) {
      void logout()
      return null
    }
    return toUserMessage(error)
  }
}
