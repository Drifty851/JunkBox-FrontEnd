import { useCallback, useEffect, useRef } from 'react'

/** Margen antes del final en que ya se pide la siguiente página, para que no se note la espera. */
const ROOT_MARGIN = '600px 0px'

/**
 * Scroll infinito para listas paginadas con cursor (feed, seguidores, comentarios).
 * Devuelve un ref para un elemento centinela al final de la lista: cuando está en pantalla (o a
 * menos de 600 px) y `enabled` es true, llama a `onReachEnd`. `enabled` debe ser false mientras
 * se carga una página, si falló o si ya no hay más, para no repetir la petición.
 * Cada vez que `enabled` vuelve a true se observa de nuevo: si la lista es corta y el centinela
 * sigue a la vista, se pide la siguiente página sin esperar a que el usuario se desplace.
 */
export function useInfiniteScroll(onReachEnd: () => void, enabled: boolean): (node: HTMLElement | null) => void {
  const callback = useRef(onReachEnd)
  const active = useRef(enabled)
  const sentinel = useRef<HTMLElement | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  const observe = useCallback(() => {
    observer.current?.disconnect()
    observer.current = null
    const node = sentinel.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    observer.current = new IntersectionObserver(
      (entries) => {
        if (active.current && entries.some((entry) => entry.isIntersecting)) callback.current()
      },
      { rootMargin: ROOT_MARGIN },
    )
    observer.current.observe(node)
  }, [])

  useEffect(() => {
    callback.current = onReachEnd
  }, [onReachEnd])

  useEffect(() => {
    active.current = enabled
    if (enabled) observe()
  }, [enabled, observe])

  useEffect(() => () => observer.current?.disconnect(), [])

  return useCallback(
    (node: HTMLElement | null) => {
      sentinel.current = node
      observe()
    },
    [observe],
  )
}
