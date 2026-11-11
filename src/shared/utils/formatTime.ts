/** Duración de una canción en "m:ss" (Figma: "3:24"). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Duración total en minutos (Figma: "34 min"). */
export function formatMinutes(ms: number): string {
  return `${Math.round(ms / 60000)} min`
}

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** Tiempo transcurrido como en Figma: "hace 10 min", "hace 2 h", "ayer"… */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) {
      return RELATIVE.format(Math.round(seconds / size), unit)
        .replace(' minutos', ' min')
        .replace(' minuto', ' min')
        .replace(' horas', ' h')
        .replace(' hora', ' h')
    }
  }
  return 'hace un momento'
}
