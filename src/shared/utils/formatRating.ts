/** Calificación con un decimal y coma, como en Figma ("4,6"). */
export function formatRating(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Número de valoraciones con separador de miles ("1.284"). */
export function formatCount(value: number): string {
  return value.toLocaleString('es-ES', { useGrouping: 'always' })
}
