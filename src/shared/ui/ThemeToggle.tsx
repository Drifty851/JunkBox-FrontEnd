import { useSyncExternalStore } from 'react'
import moonIcon from '../../assets/icons/moon.svg'
import sunIcon from '../../assets/icons/sun.svg'
import { cn } from '../utils/cn'
import { getTheme, setTheme, subscribeTheme } from '../utils/theme'
import { MaskIcon } from './MaskIcon'

/**
 * Botón de tema (no está en Figma; aprobado por el propietario, 2026-11-13): luna en claro y sol
 * en oscuro, icono de 20 px (Lucide) en un área de 28 en móvil (como el avatar, para que "Buscar música" quepa a 390 px) y 36 en escritorio. Alterna entre claro y oscuro y lo
 * recuerda en este navegador (shared/utils/theme.ts). Va en la Navbar (a la derecha del avatar) y
 * en Iniciar sesión / Registrarse; la landing no lo lleva.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={next === 'dark' ? 'Modo oscuro' : 'Modo claro'}
      className={cn(
        'flex size-7 shrink-0 cursor-pointer items-center justify-center md:size-9 rounded-full text-fg hover:bg-surface-input-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        className,
      )}
    >
      <MaskIcon src={theme === 'dark' ? sunIcon : moonIcon} size={20} className="bg-fg" />
    </button>
  )
}
