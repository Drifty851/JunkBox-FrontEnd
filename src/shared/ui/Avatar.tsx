import { useState } from 'react'
import { cn } from '../utils/cn'

interface AvatarProps {
  /** URL de la imagen (p. ej. `avatar_url` del perfil). `null` pasa al respaldo. */
  src: string | null
  /** Imagen de respaldo si `src` es null o no carga (p. ej. el robot por defecto). */
  fallbackSrc?: string | null
  /** Texto alternativo. Vacío si el avatar es decorativo. */
  alt: string
  /** Clases de tamaño (p. ej. "size-7 md:size-9"). */
  className?: string
}

/**
 * Avatar circular (Figma · slot "Avatar1" de Navbar, 28 px en móvil y 36 px en escritorio).
 * Orden: `src` → `fallbackSrc` → círculo neutro con el token de superficie (Figma no define
 * placeholder; el propietario aprobó este el 2026-11-03).
 */
export function Avatar({ src, fallbackSrc = null, alt, className }: AvatarProps) {
  const [failed, setFailed] = useState<string[]>([])
  const shown = [src, fallbackSrc].find((url): url is string => url !== null && !failed.includes(url))

  return (
    <span className={cn('block shrink-0 overflow-hidden rounded-full bg-surface-input-disabled', className)}>
      {shown !== undefined ? (
        <img
          key={shown}
          src={shown}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailed((list) => [...list, shown])}
        />
      ) : (
        alt !== '' && <span className="sr-only">{alt}</span>
      )}
    </span>
  )
}
