import logoDark from '../../assets/brand/junkbox-logo-dark.svg'
import logoLight from '../../assets/brand/junkbox-logo-light.svg'

/**
 * Logo de Junkbox (Figma · JunkboxLogo, 212×46.08).
 * Figma tiene dos versiones: las letras son #1D1D1B en claro y #F7F7F2 en oscuro.
 * Se usan los dos archivos originales y se alternan según el tema.
 */
export function JunkboxLogo() {
  return (
    <span className="block h-[46.08px] w-[212px]">
      <img src={logoLight} alt="Junkbox" width={212} height={46.08} className="block dark:hidden" />
      <img src={logoDark} alt="Junkbox" width={212} height={46.08} className="hidden dark:block" />
    </span>
  )
}
