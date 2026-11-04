/** Destino de la navegación principal (Navbar de escritorio y BottomBar de móvil). */
export interface NavigationItem {
  /** Texto de Figma ("Inicio", "Buscador", "Crear Reseña", "Perfil"). */
  label: string
  /**
   * Ruta del destino. `null` si el módulo aún no existe: se muestra con el estilo de
   * Figma, pero sin acción y con `aria-disabled`.
   */
  to: string | null
  /** Icono monocromo de la BottomBar (SVG original de Figma, 22 px). */
  icon: string
}
