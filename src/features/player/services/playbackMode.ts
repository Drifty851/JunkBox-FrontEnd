import type { PlaybackMode } from '../models/playback'

/**
 * Motor según el dispositivo (decisión del propietario, 2026-11-19): el Web Playback SDK solo
 * funciona en navegadores de escritorio, así que en teléfonos y tabletas se usa Spotify Connect.
 *  - Puntero principal fino (ratón o trackpad) y navegador con EME (contenido protegido): SDK.
 *  - Pantalla táctil como puntero principal (teléfonos, tabletas, también el iPad aunque se presente
 *    como Mac) o sin EME: Connect.
 * Si aun así el SDK no se inicia en el navegador (`initialization_error`), PlayerProvider pasa a
 * Connect.
 */
export function detectPlaybackMode(): PlaybackMode {
  const finePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches
  const hasEme = typeof navigator.requestMediaKeySystemAccess === 'function'
  return finePointer && hasEme ? 'sdk' : 'connect'
}
