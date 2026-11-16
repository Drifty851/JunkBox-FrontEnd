/** Ruta de mi perfil (Navbar y BottomBar · "Perfil"). */
export const PROFILE_PATH = '/perfil'

/** Pestañas de Figma: "Mis Reseñas" (Perfil Público) e "Historial de Calificaciones". */
export type ProfileTab = 'reviews' | 'ratings'

/** Valor de `?tab=` de cada pestaña (la URL se puede compartir y "atrás" vuelve a la anterior). */
export const PROFILE_TAB_PARAM: Record<ProfileTab, string | null> = {
  reviews: null,
  ratings: 'calificaciones',
}

/** ids que enlazan cada pestaña con su panel (patrón ARIA tabs). */
export const tabId = (tab: ProfileTab) => `profile-tab-${tab}`
export const panelId = (tab: ProfileTab) => `profile-panel-${tab}`

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
