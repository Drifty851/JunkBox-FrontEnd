/** Ruta de mi perfil (Navbar y BottomBar · "Perfil"). */
export const PROFILE_PATH = '/perfil'

/** Pestañas de Figma: "Mis Reseñas" (Perfil Público) e "Historial de Calificaciones". */
export type ProfileTab = 'reviews' | 'ratings'

/** Valor de `?tab=` de cada pestaña (la URL se puede compartir y "atrás" vuelve a la anterior). */
export const PROFILE_TAB_PARAM: Record<ProfileTab, string | null> = {
  reviews: null,
  ratings: 'calificaciones',
}

/** Perfil de otra persona (plantilla hasta PROF-05). */
export const USER_PROFILE_PATH = '/usuario/:username'
export const userProfilePath = (username: string) => `/usuario/${encodeURIComponent(username)}`

/**
 * Seguidores y seguidos (decisión del propietario, 2026-11-15): una página con dos pestañas; la ruta
 * decide la activa. Sin `username` son las mías (/perfil/...); con él, las de esa persona.
 */
export type ConnectionsTab = 'followers' | 'following'
export const CONNECTIONS_SEGMENT: Record<ConnectionsTab, string> = { followers: 'seguidores', following: 'seguidos' }
export const connectionsPath = (tab: ConnectionsTab, username?: string | null) =>
  `${username ? userProfilePath(username) : PROFILE_PATH}/${CONNECTIONS_SEGMENT[tab]}`

/** ids que enlazan cada pestaña con su panel (patrón ARIA tabs). */
export const tabId = (tab: string) => `profile-tab-${tab}`
export const panelId = (tab: string) => `profile-panel-${tab}`

export function tabFromParam(value: string | null): ProfileTab {
  return value === PROFILE_TAB_PARAM.ratings ? 'ratings' : 'reviews'
}

/**
 * Contadores de ProfileStats (Figma). `null` = el backend aún no los da (PROF-03): se muestra "—".
 */
export interface ProfileStats {
  reviews: number | null
  ratings: number | null
  followers: number | null
  following: number | null
}

/** Resumen de "Una vida en canciones" (Historial). `null` hasta PROF-03. */
export interface RatingSummaryStats {
  average: number | null
  fiveStars: number | null
}

/** "En Junkbox desde septiembre de 2024" (Figma) a partir de `created_at`. */
export function memberSince(createdAt: string): string | null {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return `En Junkbox desde ${date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
}
