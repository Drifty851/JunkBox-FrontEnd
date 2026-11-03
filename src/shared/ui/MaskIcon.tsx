import type { CSSProperties } from 'react'
import { cn } from '../utils/cn'

interface MaskIconProps {
  /** URL del SVG original de Figma (src/assets/icons). */
  src: string
  /** Tamaño en px, igual al tamaño raíz del recurso. */
  size: number
  /** Clases de Tailwind para el color (bg-*), por ejemplo "bg-fg-muted". */
  className?: string
}

/**
 * Pinta un icono de un solo color de Figma como máscara CSS: la forma es exactamente
 * la del recurso original y el color sale del token del tema (claro/oscuro), sin
 * modificar el SVG. Es decorativo (aria-hidden).
 */
export function MaskIcon({ src, size, className }: MaskIconProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    maskImage: `url("${src}")`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskImage: `url("${src}")`,
    WebkitMaskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
  }
  return <span aria-hidden="true" className={cn('inline-block shrink-0', className)} style={style} />
}
