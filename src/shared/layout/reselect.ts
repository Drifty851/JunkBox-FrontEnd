/**
 * Volver a pulsar un destino de la navegación estando ya en él (decisión del propietario,
 * 2026-11-19: el logo, "Inicio" y la BottomBar reinician Inicio). NavTarget navega a la misma
 * ruta con una marca nueva en `location.state`; la pantalla la usa como `key` para volver a
 * montarse y pedir sus datos, sin recargar el navegador (la música sigue sonando).
 */
const RESELECT_KEY = 'reselect'

export const reselectState = () => ({ [RESELECT_KEY]: Date.now() })

/** Marca de la última vez que se volvió a pulsar el destino, o '' si no hay. */
export function reselectToken(state: unknown): string {
  if (typeof state !== 'object' || state === null) return ''
  const value: unknown = Reflect.get(state, RESELECT_KEY)
  return typeof value === 'number' ? String(value) : ''
}
