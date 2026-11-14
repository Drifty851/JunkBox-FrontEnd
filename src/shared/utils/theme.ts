/**
 * Tema claro / oscuro.
 *
 * Por defecto la app sigue el tema del sistema (`prefers-color-scheme`, ver src/index.css). Si el
 * usuario lo cambia con el botón de sol/luna, la elección se guarda en este navegador y se fuerza
 * con `<html data-theme="light|dark">`. index.html la aplica antes de pintar para que no parpadee
 * (usa la misma clave que THEME_STORAGE_KEY).
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'junkbox.theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Tema que se ve ahora: el elegido por el usuario o, si no eligió, el del sistema. */
export function getTheme(): Theme {
  const forced = document.documentElement.dataset.theme
  return forced === 'light' || forced === 'dark' ? forced : systemTheme()
}

const listeners = new Set<() => void>()

/** Fija el tema, lo guarda y avisa a los suscriptores (useSyncExternalStore). */
export function setTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Sin almacenamiento (modo privado estricto): el cambio vale solo para esta visita.
  }
  listeners.forEach((listener) => listener())
}

/** Suscripción para useSyncExternalStore: cambios del botón y del tema del sistema. */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', listener)
  }
}

