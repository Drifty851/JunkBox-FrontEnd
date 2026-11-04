import logoDark from '../../assets/brand/junkbox-logo-dark.svg'
import logoLight from '../../assets/brand/junkbox-logo-light.svg'
import { cn } from '../utils/cn'

interface JunkboxLogoProps {
  /**
   * Clases de tamaño del contenedor. Por defecto, el de AuthShell (212×46.08).
   * La Navbar usa el mismo arte a 128×27.81 (móvil) y 160×34.77 (escritorio).
   */
  className?: string
}

/**
 * Logo de Junkbox (Figma · JunkboxLogo).
 * Figma tiene dos versiones: las letras son #1D1D1B en claro y #F7F7F2 en oscuro.
 * Se usan los dos archivos originales y se alternan según el tema. Los logos de la
 * Navbar son el mismo arte exportado a otro tamaño (mismos trazados y colores).
 */
export function JunkboxLogo({ className = 'h-[46.08px] w-[212px]' }: JunkboxLogoProps) {
  return (
    <span className={cn('block shrink-0', className)}>
      <img src={logoLight} alt="Junkbox" width={212} height={46.08} className="block size-full dark:hidden" />
      <img src={logoDark} alt="Junkbox" width={212} height={46.08} className="hidden size-full dark:block" />
    </span>
  )
}
