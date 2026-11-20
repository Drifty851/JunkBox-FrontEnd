import type { MouseEvent, ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { cn } from '../utils/cn'
import { reselectState } from './reselect'

interface NavTargetProps {
  /** Ruta del destino; `null` si el módulo aún no existe. */
  to: string | null
  /** Clases comunes; `isActive` permite pintar el estado actual. */
  className: (isActive: boolean) => string
  children: (isActive: boolean) => ReactNode
  /** Nombre accesible cuando el contenido no tiene texto visible. */
  ariaLabel?: string
  /**
   * Si ya se está en la ruta, pulsarlo la reinicia: sube al principio y navega a la misma ruta
   * con una marca nueva (`reselect.ts`) para que la pantalla vuelva a pedir sus datos.
   */
  refreshOnReselect?: boolean
}

/**
 * Enlace de navegación principal.
 * - Con ruta: NavLink (añade aria-current="page" en la ruta activa).
 * - Sin ruta: botón sin acción con aria-disabled, igual que "¿Olvidaste tu contraseña?"
 *   en Auth. Conserva el estilo de Figma y se activará cuando exista el módulo.
 */
/** Foco visible, igual que el resto de controles (PrimaryButton, Checkbox…). */
const FOCUS_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export function NavTarget({ to, className, children, ariaLabel, refreshOnReselect = false }: NavTargetProps) {
  const location = useLocation()
  const navigate = useNavigate()

  if (to === null) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={ariaLabel}
        className={cn('cursor-default', FOCUS_CLASSES, className(false))}
        onClick={(event) => event.preventDefault()}
      >
        {children(false)}
      </button>
    )
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl/Cmd/Mayús o botón central: abrir en otra pestaña como cualquier enlace.
    if (!refreshOnReselect || location.pathname !== to || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    window.scrollTo({ top: 0 })
    void navigate(to, { replace: true, state: reselectState() })
  }

  return (
    // Solo Inicio ("/") exige coincidencia exacta: "Perfil" sigue activo en /perfil/seguidores.
    <NavLink
      to={to}
      end={to === '/'}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={({ isActive }) => cn(FOCUS_CLASSES, className(isActive))}
    >
      {({ isActive }) => children(isActive)}
    </NavLink>
  )
}
