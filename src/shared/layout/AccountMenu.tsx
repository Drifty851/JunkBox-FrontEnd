import { useEffect, useId, useRef, useState } from 'react'
import { Avatar } from '../ui/Avatar'

interface AccountMenuProps {
  avatarUrl: string | null
  /** Nombre accesible del botón, p. ej. "Cuenta de @cesar_beltran". */
  label: string
  onLogout: () => Promise<void>
}

/**
 * PROVISIONAL. Menú al pulsar el avatar de la Navbar con "Cerrar sesión".
 * Figma no ubica el cierre de sesión en Inicio (probablemente esté en Configuración).
 * Lo aprobó el propietario (2026-11-04) hasta que exista ese módulo. Estilo con los
 * tokens existentes; no sale de Figma.
 */
export function AccountMenu({ avatarUrl, label, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleLogout() {
    setLeaving(true)
    await onLogout()
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="block cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <Avatar src={avatarUrl} alt="" className="size-7 md:size-9" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute top-full right-0 z-20 mt-2 min-w-40 rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            disabled={leaving}
            onClick={handleLogout}
            className="block w-full cursor-pointer px-4 py-2 text-left text-sm leading-[1.4] text-fg hover:bg-surface-input-disabled focus-visible:bg-surface-input-disabled focus-visible:outline-none disabled:cursor-progress"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
