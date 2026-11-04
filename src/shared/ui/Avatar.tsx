import { useState } from 'react'
import { cn } from '../utils/cn'

interface AvatarProps {
  /** URL de la imagen (p. ej. `avatar_url` del perfil). `null` muestra el placeholder. */
  src: string | null
  /** Texto alternativo. Vacío si el avatar es decorativo. */
  alt: string
  /** Clases de tamaño (p. ej. "size-7 md:size-9"). */
  className?: string
}

/**
 * Avatar circular (Figma · slot "Avatar1" de Navbar, 28 px en móvil y 36 px en escritorio).
 * Sin imagen, o si no carga, muestra un círculo neutro con el token de superficie:
 * Figma no define placeholder y el propietario aprobó este (2026-11-03).
 */
export function Avatar({ src, alt, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src !== null && src !== failedSrc

  return (
    <span className={cn('block shrink-0 overflow-hidden rounded-full bg-surface-input-disabled', className)}>
      {showImage ? (
        <img src={src} alt={alt} className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        alt !== '' && <span className="sr-only">{alt}</span>
      )}
    </span>
  )
}
