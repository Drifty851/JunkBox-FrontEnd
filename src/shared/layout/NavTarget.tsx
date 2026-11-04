import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '../utils/cn'

interface NavTargetProps {
  /** Ruta del destino; `null` si el módulo aún no existe. */
  to: string | null
  /** Clases comunes; `isActive` permite pintar el estado actual. */
  className: (isActive: boolean) => string
  children: (isActive: boolean) => ReactNode
  /** Nombre accesible cuando el contenido no tiene texto visible. */
  ariaLabel?: string
}

/**
 * Enlace de navegación principal.
 * - Con ruta: NavLink (añade aria-current="page" en la ruta activa).
 * - Sin ruta: botón sin acción con aria-disabled, igual que "¿Olvidaste tu contraseña?"
 *   en Auth. Conserva el estilo de Figma y se activará cuando exista el módulo.
 */
/** Foco visible, igual que el resto de controles (PrimaryButton, Checkbox…). */
const FOCUS_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export function NavTarget({ to, className, children, ariaLabel }: NavTargetProps) {
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

  return (
    <NavLink to={to} end aria-label={ariaLabel} className={({ isActive }) => cn(FOCUS_CLASSES, className(isActive))}>
      {({ isActive }) => children(isActive)}
    </NavLink>
  )
}
